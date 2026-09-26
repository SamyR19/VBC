import { useEffect, useRef, useState, type ReactNode } from 'react'
import { QUICK_ACTIONS, type IdeaSuggestion } from '../../supabase/functions/_shared/coach'
import { newId } from '../lib/store/store'
import type { IdeaEffort } from '../lib/types'
import { useTeam } from '../state/app'
import { useCoach } from '../state/coach'
import { useMutations } from '../state/data'

/** Minimal, safe formatter for the coach's replies: paragraphs, "- " / "1." bullets and **bold**. */
function Rich({ text }: { text: string }) {
  const inline = (s: string): ReactNode[] =>
    s.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
      part.startsWith('**') && part.endsWith('**') ? <strong key={i}>{part.slice(2, -2)}</strong> : part,
    )
  const blocks: ReactNode[] = []
  let list: { ordered: boolean; items: string[] } | null = null
  const flush = () => {
    if (!list) return
    const items = list.items.map((it, i) => <li key={i}>{inline(it)}</li>)
    blocks.push(
      list.ordered ? (
        <ol key={blocks.length} className="ml-5 list-decimal space-y-1">{items}</ol>
      ) : (
        <ul key={blocks.length} className="ml-5 list-disc space-y-1">{items}</ul>
      ),
    )
    list = null
  }
  for (const raw of text.split('\n')) {
    const line = raw.trim()
    const bullet = line.match(/^[-•*]\s+(.*)$/)
    const numbered = line.match(/^\d+[.)]\s+(.*)$/)
    if (bullet || numbered) {
      const ordered = !!numbered
      if (!list || list.ordered !== ordered) {
        flush()
        list = { ordered, items: [] }
      }
      list.items.push((bullet ?? numbered)![1])
    } else {
      flush()
      if (line) blocks.push(<p key={blocks.length}>{inline(line)}</p>)
    }
  }
  flush()
  return <div className="space-y-2">{blocks}</div>
}

function IdeaCard({ idea }: { idea: IdeaSuggestion }) {
  const { canEdit } = useTeam()
  const { insert } = useMutations('backlog')
  const [added, setAdded] = useState(false)
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3 text-sm dark:border-slate-700 dark:bg-slate-950">
      <div className="flex items-start justify-between gap-2">
        <div className="font-medium">{idea.idea}</div>
        <span className="chip shrink-0">{['low', 'med', 'high'][idea.priority] ?? 'med'}</span>
      </div>
      {(idea.variable || idea.to_value) && (
        <div className="mt-1 text-xs text-slate-500">
          {idea.category && `${idea.category} · `}
          {idea.variable}: {idea.from_value || '?'} → {idea.to_value || '?'}
        </div>
      )}
      {idea.expected_effect && <div className="mt-1 text-xs">Expect: {idea.expected_effect}</div>}
      {idea.rationale && <div className="mt-1 text-xs text-slate-500">Why: {idea.rationale}</div>}
      {canEdit && (
        <button
          type="button"
          className="btn btn-secondary mt-2 w-full py-1 text-xs"
          disabled={added || insert.isPending}
          onClick={async () => {
            await insert.mutateAsync({
              id: newId(),
              idea: idea.idea,
              variable: idea.variable || null,
              category: idea.category || null,
              from_value: idea.from_value || null,
              to_value: idea.to_value || null,
              expected_effect: idea.expected_effect || null,
              rationale: idea.rationale || null,
              effort: (idea.effort as IdeaEffort) || null,
              source: 'ai',
              priority: idea.priority,
              status: 'queued',
              tested_attempt_id: null,
            })
            setAdded(true)
          }}
        >
          {added ? '✓ Added to ideas' : '+ Add to experiment ideas'}
        </button>
      )}
    </div>
  )
}

export function CoachPanel({ onClose }: { onClose?: () => void }) {
  const { messages, busy, locked, send, draft, setDraft, clear, page } = useCoach()
  const { mode } = useTeam()
  const endRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'end' })
  }, [messages.length, busy])

  return (
    <div className="flex h-full min-h-0 flex-col" aria-label="AI coach">
      <div className="flex items-center justify-between gap-2 border-b border-slate-200 px-4 py-3 dark:border-slate-800">
        <div>
          <div className="font-semibold">AI coach</div>
          <div className="text-xs text-slate-500">Sees your runs · on: {page.label}</div>
        </div>
        <div className="flex gap-1">
          {messages.length > 0 && (
            <button className="btn btn-ghost px-2 py-1 text-xs" onClick={() => confirm('Clear the chat history?') && clear()}>
              Clear
            </button>
          )}
          {onClose && (
            <button className="btn btn-ghost px-2 py-1" aria-label="Close AI coach" onClick={onClose}>
              ✕
            </button>
          )}
        </div>
      </div>

      {locked ? (
        <div className="m-4 rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200">
          <p className="font-medium">Coach paused — competition window open</p>
          <p className="mt-1">
            DECA participants pledge they got no outside help, so the coach is off while a round or mini-challenge is open. Keep
            logging runs; the coach comes back when the window closes. If your advisor confirms AI help is allowed, a teammate
            can turn it on in Team settings.
          </p>
        </div>
      ) : (
        <>
          <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-3 text-sm">
            {messages.length === 0 && (
              <div className="space-y-2 text-slate-600 dark:text-slate-400">
                <p>
                  I read your logged runs, your best run's decisions, your idea list and which changes helped. Tap a button below, or ask
                  anything.
                </p>
                <p className="text-xs">
                  I can't see the simulation itself, so my advice is only as good as what you log.{' '}
                  {mode === 'local' ? 'Local mode uses your own OpenAI key (Team settings).' : ''}
                </p>
              </div>
            )}
            {messages.map((m) => (
              <div key={m.id} className={m.role === 'user' ? 'flex justify-end' : ''}>
                <div
                  className={
                    m.role === 'user'
                      ? 'max-w-[85%] rounded-2xl rounded-br-sm bg-brand-600 px-3 py-2 text-white'
                      : m.error
                        ? 'rounded-2xl bg-rose-50 px-3 py-2 text-rose-800 dark:bg-rose-950 dark:text-rose-200'
                        : 'space-y-2'
                  }
                >
                  {m.role === 'user' ? <p className="whitespace-pre-wrap">{m.display ?? m.content}</p> : <Rich text={m.content} />}
                  {m.ideas && m.ideas.length > 0 && (
                    <div className="space-y-2 pt-1">
                      {m.ideas.map((idea, i) => (
                        <IdeaCard key={i} idea={idea} />
                      ))}
                    </div>
                  )}
                  {m.follow_ups && m.follow_ups.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {m.follow_ups.map((f) => (
                        <button key={f} className="chip hover:bg-slate-200 dark:hover:bg-slate-700" disabled={busy} onClick={() => void send(f)}>
                          {f}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {busy && <div className="animate-pulse text-slate-500">Thinking…</div>}
            <div ref={endRef} />
          </div>

          <div className="border-t border-slate-200 p-3 dark:border-slate-800">
            <div className="mb-2 flex gap-1.5 overflow-x-auto pb-1">
              {QUICK_ACTIONS.map((a) => (
                <button
                  key={a.id}
                  className="chip shrink-0 hover:bg-slate-200 dark:hover:bg-slate-700"
                  disabled={busy}
                  onClick={() => {
                    if (a.draft) {
                      setDraft(a.prompt)
                      inputRef.current?.focus()
                    } else void send(a.prompt, a.label)
                  }}
                >
                  {a.label}
                </button>
              ))}
            </div>
            <form
              className="flex items-end gap-2"
              onSubmit={(e) => {
                e.preventDefault()
                void send(draft)
              }}
            >
              <textarea
                ref={inputRef}
                className="input max-h-32 min-h-10 resize-none py-2"
                rows={1}
                placeholder="Ask the coach…"
                aria-label="Message the AI coach"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    void send(draft)
                  }
                }}
              />
              <button className="btn btn-primary shrink-0" disabled={busy || !draft.trim()}>
                Send
              </button>
            </form>
          </div>
        </>
      )}
    </div>
  )
}
