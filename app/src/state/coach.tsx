import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { ChatTurn, IdeaSuggestion } from '../../supabase/functions/_shared/coach'
import { askCoach, CoachError } from '../lib/coachClient'
import { buildCoachContext } from '../lib/coachContext'
import { competitionActive } from '../lib/metrics'
import { useTeam } from './app'
import { useActiveRound, useNow, useRows } from './data'

export interface CoachMessage extends ChatTurn {
  id: string
  /** Short text shown in the bubble instead of the full prompt (quick actions). */
  display?: string
  ideas?: IdeaSuggestion[]
  follow_ups?: string[]
  error?: boolean
  at: string
}

interface CoachState {
  messages: CoachMessage[]
  busy: boolean
  locked: boolean
  open: boolean
  setOpen: (v: boolean) => void
  draft: string
  setDraft: (v: string) => void
  send: (text: string, display?: string) => Promise<void>
  clear: () => void
  page: { label: string; details: string }
  setPage: (p: { label: string; details: string }) => void
}

const CoachContext = createContext<CoachState | null>(null)
const HISTORY_LIMIT = 40

export function CoachProvider({ children }: { children: ReactNode }) {
  const { team, cloudStore } = useTeam()
  const { round, rounds } = useActiveRound()
  const { data: attempts = [] } = useRows('attempts')
  const { data: backlog = [] } = useRows('backlog')
  const { data: snapshots = [] } = useRows('leaderboard_snapshots')
  const { data: windows = [] } = useRows('round_windows')
  const now = useNow(60_000)
  const storageKey = `vbc:chat:${team.id}`

  const [messages, setMessages] = useState<CoachMessage[]>(() => {
    try {
      return JSON.parse(localStorage.getItem(storageKey) ?? '[]') as CoachMessage[]
    } catch {
      return []
    }
  })
  const [busy, setBusy] = useState(false)
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState('')
  const [page, setPage] = useState({ label: 'Home', details: '' })

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(messages.slice(-HISTORY_LIMIT)))
    } catch {
      /* storage full or blocked — history just won't persist */
    }
  }, [messages, storageKey])

  const locked = !team.ai_in_rounds && competitionActive(team, rounds, windows, now)

  const send = useCallback(
    async (text: string, display?: string) => {
      const content = text.trim()
      if (!content || busy) return
      const userMsg: CoachMessage = { id: crypto.randomUUID(), role: 'user', content, display, at: new Date().toISOString() }
      const history = [...messages.filter((m) => !m.error), userMsg]
      setMessages((m) => [...m, userMsg])
      setDraft('')
      setBusy(true)
      try {
        const context = buildCoachContext({ team, round, attempts, backlog, snapshots, page, now: new Date() })
        const reply = await askCoach({
          cloud: cloudStore,
          teamId: team.id,
          context,
          messages: history.map(({ role, content }) => ({ role, content })),
        })
        setMessages((m) => [
          ...m,
          {
            id: crypto.randomUUID(),
            role: 'assistant',
            content: reply.reply,
            ideas: reply.ideas,
            follow_ups: reply.follow_ups,
            at: new Date().toISOString(),
          },
        ])
      } catch (e) {
        const msg = e instanceof CoachError || e instanceof Error ? e.message : String(e)
        setMessages((m) => [...m, { id: crypto.randomUUID(), role: 'assistant', content: msg, error: true, at: new Date().toISOString() }])
      } finally {
        setBusy(false)
      }
    },
    [busy, messages, team, round, attempts, backlog, snapshots, page, cloudStore],
  )

  const value = useMemo<CoachState>(
    () => ({
      messages,
      busy,
      locked,
      open,
      setOpen,
      draft,
      setDraft,
      send,
      clear: () => setMessages([]),
      page,
      setPage,
    }),
    [messages, busy, locked, open, draft, send, page],
  )
  return <CoachContext.Provider value={value}>{children}</CoachContext.Provider>
}

export function useCoach(): CoachState {
  const ctx = useContext(CoachContext)
  if (!ctx) throw new Error('useCoach outside CoachProvider')
  return ctx
}

/** Pages call this so the coach knows what the user is looking at. */
export function useCoachPage(label: string, details = '') {
  const ctx = useContext(CoachContext)
  const setPage = ctx?.setPage
  useEffect(() => {
    setPage?.({ label, details })
  }, [setPage, label, details])
}
