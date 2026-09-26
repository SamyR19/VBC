import { useMemo, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { Card, Empty, ErrorNote, Field, PageHeader, Spinner } from '../components/ui'
import { emptyIdea } from '../lib/data'
import { formatScore, personalBest, scoreOf } from '../lib/metrics'
import { DECISION_TEMPLATE, IDEA_CATEGORIES } from '../lib/season'
import { newId } from '../lib/store/store'
import type { BacklogItem, IdeaEffort, IdeaSource } from '../lib/types'
import { useTeam } from '../state/app'
import { useCoachPage } from '../state/coach'
import { useActiveRound, useMutations, useRows } from '../state/data'

const PRIORITY = [
  { v: 2, label: 'High' },
  { v: 1, label: 'Medium' },
  { v: 0, label: 'Low' },
]
const EFFORT: { v: IdeaEffort; label: string }[] = [
  { v: 'quick', label: 'Quick (1 run)' },
  { v: 'medium', label: 'Medium (2–3 runs)' },
  { v: 'big', label: 'Big (series of runs)' },
]
const SOURCE_LABEL: Record<IdeaSource, string> = { me: 'You', teammate: 'Teammate', advisor: 'Advisor', ai: 'AI coach' }

interface Draft {
  idea: string
  category: string
  variable: string
  from_value: string
  to_value: string
  expected_effect: string
  rationale: string
  priority: number
  effort: '' | IdeaEffort
  source: IdeaSource
}

const blank = (): Draft => ({
  idea: '',
  category: '',
  variable: '',
  from_value: '',
  to_value: '',
  expected_effect: '',
  rationale: '',
  priority: 1,
  effort: 'quick',
  source: 'me',
})

const toDraft = (b: BacklogItem): Draft => ({
  idea: b.idea,
  category: b.category ?? '',
  variable: b.variable ?? '',
  from_value: b.from_value ?? '',
  to_value: b.to_value ?? '',
  expected_effect: b.expected_effect ?? '',
  rationale: b.rationale ?? '',
  priority: b.priority,
  effort: b.effort ?? '',
  source: b.source ?? 'me',
})

function IdeaForm({ initial, onSave, onCancel, submitLabel }: { initial: Draft; onSave: (d: Draft) => Promise<void>; onCancel?: () => void; submitLabel: string }) {
  const { round } = useActiveRound()
  const { data: attempts = [] } = useRows('attempts')
  const [d, setD] = useState(initial)
  const [error, setError] = useState<unknown>(null)
  const [busy, setBusy] = useState(false)
  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setD({ ...d, [k]: v })

  const pb = round ? personalBest(attempts.filter((a) => a.round_id === round.id), round.ranking_metric) : null
  const variableOptions = useMemo(() => {
    const fromGroup = DECISION_TEMPLATE.find((g) => g.group === d.category)?.fields.map((f) => f.key) ?? []
    const logged = pb?.decisions.map((d2) => d2.key) ?? []
    return [...new Set([...fromGroup, ...logged])]
  }, [d.category, pb])
  const pbValue = pb?.decisions.find((x) => x.key.trim().toLowerCase() === d.variable.trim().toLowerCase())?.value

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (!d.idea.trim()) return setError(new Error('Write the idea in one line.'))
    setBusy(true)
    setError(null)
    try {
      await onSave(d)
    } catch (err) {
      setError(err)
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <Field label="Idea" htmlFor="idea" hint='One line, starting with a verb: "Raise main price from $5.00 to $5.50".'>
        <input id="idea" className="input" value={d.idea} onChange={(e) => set('idea', e.target.value)} />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Area" htmlFor="idea-cat" hint="Which part of the business it changes.">
          <select id="idea-cat" className="input" value={d.category} onChange={(e) => set('category', e.target.value)}>
            <option value="">—</option>
            {IDEA_CATEGORIES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </Field>
        <Field label="Decision to change" htmlFor="idea-var" hint="Use the same name as in your logged decisions so the app can pre-fill it.">
          <input id="idea-var" className="input" list="idea-vars" value={d.variable} onChange={(e) => set('variable', e.target.value)} />
          <datalist id="idea-vars">
            {variableOptions.map((v) => (
              <option key={v} value={v} />
            ))}
          </datalist>
        </Field>
        <Field label="From (current value)" htmlFor="idea-from" hint={pbValue ? `Your PB uses: ${pbValue}` : 'The value in your best run.'}>
          <div className="flex gap-2">
            <input id="idea-from" className="input" value={d.from_value} onChange={(e) => set('from_value', e.target.value)} />
            {pbValue && d.from_value !== pbValue && (
              <button type="button" className="btn btn-secondary shrink-0 px-2 text-xs" onClick={() => set('from_value', pbValue)}>
                Use PB
              </button>
            )}
          </div>
        </Field>
        <Field label="To (new value)" htmlFor="idea-to" hint="The exact value to try. It's applied automatically when you press Test it.">
          <input id="idea-to" className="input" value={d.to_value} onChange={(e) => set('to_value', e.target.value)} />
        </Field>
      </div>
      <Field label="Expected effect" htmlFor="idea-exp" hint="What should happen to profit / net worth, and roughly how much.">
        <input id="idea-exp" className="input" value={d.expected_effect} onChange={(e) => set('expected_effect', e.target.value)} />
      </Field>
      <Field label="Why (evidence)" htmlFor="idea-why" hint="What in your data or reports suggests this — or 'untested area'.">
        <textarea id="idea-why" className="input min-h-16" value={d.rationale} onChange={(e) => set('rationale', e.target.value)} />
      </Field>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <Field label="Priority" htmlFor="idea-pri">
          <select id="idea-pri" className="input" value={d.priority} onChange={(e) => set('priority', Number(e.target.value))}>
            {PRIORITY.map((p) => (
              <option key={p.v} value={p.v}>
                {p.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Effort" htmlFor="idea-eff">
          <select id="idea-eff" className="input" value={d.effort} onChange={(e) => set('effort', e.target.value as Draft['effort'])}>
            <option value="">—</option>
            {EFFORT.map((x) => (
              <option key={x.v} value={x.v}>
                {x.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Suggested by" htmlFor="idea-src">
          <select id="idea-src" className="input" value={d.source} onChange={(e) => set('source', e.target.value as IdeaSource)}>
            {(Object.keys(SOURCE_LABEL) as IdeaSource[]).map((s) => (
              <option key={s} value={s}>
                {SOURCE_LABEL[s]}
              </option>
            ))}
          </select>
        </Field>
      </div>
      <ErrorNote error={error} />
      <div className="flex justify-end gap-2">
        {onCancel && (
          <button type="button" className="btn btn-ghost" onClick={onCancel}>
            Cancel
          </button>
        )}
        <button className="btn btn-primary" disabled={busy || !d.idea.trim()}>
          {submitLabel}
        </button>
      </div>
    </form>
  )
}

const toRow = (d: Draft) => ({
  idea: d.idea.trim(),
  category: d.category || null,
  variable: d.variable.trim() || null,
  from_value: d.from_value.trim() || null,
  to_value: d.to_value.trim() || null,
  expected_effect: d.expected_effect.trim() || null,
  rationale: d.rationale.trim() || null,
  priority: d.priority,
  effort: d.effort || null,
  source: d.source,
})

export function Backlog() {
  const { canEdit } = useTeam()
  const { round } = useActiveRound()
  const { data: items = [], isLoading } = useRows('backlog')
  const { data: attempts = [] } = useRows('attempts')
  const { insert, update, remove } = useMutations('backlog')
  const [show, setShow] = useState<'queued' | 'done'>('queued')
  const [adding, setAdding] = useState(false)
  const [editing, setEditing] = useState<string | null>(null)
  const [category, setCategory] = useState('')
  const [source, setSource] = useState('')

  const queued = items.filter((b) => b.status === 'queued')
  useCoachPage(
    'Experiment ideas',
    `${queued.length} queued ideas; ${items.length - queued.length} tested/dropped.`,
  )

  if (isLoading) return <Spinner />

  const list = items
    .filter((b) => (show === 'queued' ? b.status === 'queued' : b.status !== 'queued'))
    .filter((b) => !category || b.category === category)
    .filter((b) => !source || (b.source ?? 'me') === source)
    .sort((a, b) => b.priority - a.priority || a.created_at.localeCompare(b.created_at))
  const metric = round?.ranking_metric ?? 'profit'

  return (
    <div className="space-y-4">
      <PageHeader
        title="Experiment ideas"
        subtitle="Queue single-change tests with exact values, so every run in a session is already planned."
        actions={
          canEdit &&
          !adding && (
            <button className="btn btn-primary" onClick={() => setAdding(true)}>
              + New idea
            </button>
          )
        }
      />

      {adding && canEdit && (
        <Card>
          <h2 className="mb-3 font-semibold">New experiment idea</h2>
          <IdeaForm
            initial={blank()}
            submitLabel="Add idea"
            onCancel={() => setAdding(false)}
            onSave={async (d) => {
              await insert.mutateAsync({ ...emptyIdea(), ...toRow(d), id: newId(), status: 'queued', tested_attempt_id: null })
              setAdding(false)
            }}
          />
        </Card>
      )}

      <div className="flex flex-wrap items-center gap-2">
        {(['queued', 'done'] as const).map((s) => (
          <button key={s} className={`btn ${show === s ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setShow(s)}>
            {s === 'queued' ? `Queued (${queued.length})` : `Tested / dropped (${items.length - queued.length})`}
          </button>
        ))}
        <select className="input ml-auto w-auto" aria-label="Filter by area" value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="">All areas</option>
          {IDEA_CATEGORIES.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
        <select className="input w-auto" aria-label="Filter by source" value={source} onChange={(e) => setSource(e.target.value)}>
          <option value="">Anyone</option>
          {(Object.keys(SOURCE_LABEL) as IdeaSource[]).map((s) => (
            <option key={s} value={s}>
              {SOURCE_LABEL[s]}
            </option>
          ))}
        </select>
      </div>

      {list.length === 0 ? (
        <Empty title={show === 'queued' ? 'No queued ideas' : 'Nothing tested yet'}>
          After every run, write down the next thing to test — or ask the AI coach “💡 Suggest next experiments”.
        </Empty>
      ) : (
        <ul className="space-y-2">
          {list.map((b) => {
            const result = b.tested_attempt_id ? attempts.find((a) => a.id === b.tested_attempt_id) : undefined
            if (editing === b.id)
              return (
                <li key={b.id} className="card">
                  <IdeaForm
                    initial={toDraft(b)}
                    submitLabel="Save"
                    onCancel={() => setEditing(null)}
                    onSave={async (d) => {
                      await update.mutateAsync({ id: b.id, patch: toRow(d) })
                      setEditing(null)
                    }}
                  />
                </li>
              )
            return (
              <li key={b.id} className="card space-y-2">
                <div className="flex flex-wrap items-start gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="font-medium">{b.idea}</div>
                    <div className="mt-1 flex flex-wrap gap-1.5 text-xs">
                      <span className={`chip ${b.priority === 2 ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300' : ''}`}>
                        {PRIORITY.find((p) => p.v === b.priority)?.label ?? 'Low'} priority
                      </span>
                      {b.category && <span className="chip">{b.category}</span>}
                      {b.effort && <span className="chip">{EFFORT.find((x) => x.v === b.effort)?.label}</span>}
                      <span className="chip">by {SOURCE_LABEL[b.source ?? 'me']}</span>
                      {b.status !== 'queued' && <span className="chip">{b.status}</span>}
                    </div>
                  </div>
                  {canEdit && (
                    <div className="flex flex-wrap gap-1">
                      {b.status === 'queued' ? (
                        <>
                          <Link className="btn btn-primary" to={`/attempts/new?backlog=${b.id}`}>
                            Test it
                          </Link>
                          <button className="btn btn-ghost" onClick={() => setEditing(b.id)}>
                            Edit
                          </button>
                          <button className="btn btn-ghost" onClick={() => update.mutate({ id: b.id, patch: { status: 'dropped' } })}>
                            Drop
                          </button>
                        </>
                      ) : (
                        <button className="btn btn-ghost" onClick={() => update.mutate({ id: b.id, patch: { status: 'queued' } })}>
                          Re-queue
                        </button>
                      )}
                      <button className="btn btn-ghost" aria-label="Delete idea" onClick={() => confirm('Delete this idea?') && remove.mutate(b.id)}>
                        ✕
                      </button>
                    </div>
                  )}
                </div>
                {(b.variable || b.from_value || b.to_value || b.expected_effect || b.rationale) && (
                  <dl className="grid gap-x-4 gap-y-1 text-sm sm:grid-cols-[8rem_1fr]">
                    {(b.variable || b.to_value) && (
                      <>
                        <dt className="text-slate-500">Change</dt>
                        <dd>
                          <strong>{b.variable || 'decision'}</strong>: {b.from_value || '?'} → {b.to_value || '?'}
                        </dd>
                      </>
                    )}
                    {b.expected_effect && (
                      <>
                        <dt className="text-slate-500">Expected</dt>
                        <dd>{b.expected_effect}</dd>
                      </>
                    )}
                    {b.rationale && (
                      <>
                        <dt className="text-slate-500">Why</dt>
                        <dd className="text-slate-600 dark:text-slate-400">{b.rationale}</dd>
                      </>
                    )}
                    {result && (
                      <>
                        <dt className="text-slate-500">Result</dt>
                        <dd>
                          <Link className="underline" to={`/attempts/${result.id}`}>
                            {formatScore(scoreOf(result, metric), metric)} · {result.verdict ?? 'no verdict'}
                          </Link>
                        </dd>
                      </>
                    )}
                  </dl>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
