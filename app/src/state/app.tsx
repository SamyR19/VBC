import { createClient, type Session } from '@supabase/supabase-js'
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { LocalStore } from '../lib/store/local'
import type { Store } from '../lib/store/store'
import { SupabaseStore } from '../lib/store/supabase'
import type { Member, Team } from '../lib/types'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string | undefined
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

export const CLOUD_ENABLED = !!(SUPABASE_URL && SUPABASE_KEY)

const localStore = CLOUD_ENABLED ? null : new LocalStore()
const cloudStore = CLOUD_ENABLED ? new SupabaseStore(createClient(SUPABASE_URL!, SUPABASE_KEY!)) : null

export type AppStatus = 'loading' | 'signed_out' | 'no_team' | 'ready'

export interface AppContextValue {
  status: AppStatus
  mode: 'local' | 'cloud'
  store: Store
  localStore: LocalStore | null
  cloudStore: SupabaseStore | null
  session: Session | null
  team: Team | null
  me: Member | null
  memberships: (Member & { team: Team })[]
  /** Advisors are read-only. Local mode is always editable. */
  canEdit: boolean
  error: string | null
  selectTeam: (teamId: string) => void
  refresh: () => Promise<void>
  setTeam: (team: Team) => void
  signOut: () => Promise<void>
}

const AppContext = createContext<AppContextValue | null>(null)

const CLOUD_TEAM_KEY = 'vbc:cloudTeam'

export function AppProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AppStatus>('loading')
  const [session, setSession] = useState<Session | null>(null)
  const [team, setTeam] = useState<Team | null>(null)
  const [me, setMe] = useState<Member | null>(null)
  const [memberships, setMemberships] = useState<(Member & { team: Team })[]>([])
  const [error, setError] = useState<string | null>(null)

  const loadLocal = useCallback(async () => {
    const id = localStore!.currentTeamId()
    if (!id) {
      setTeam(null)
      setStatus('no_team')
      return
    }
    setTeam(await localStore!.getTeam(id))
    setStatus('ready')
  }, [])

  const loadCloud = useCallback(async (s: Session | null) => {
    setSession(s)
    if (!s) {
      setTeam(null)
      setMe(null)
      setMemberships([])
      setStatus('signed_out')
      return
    }
    try {
      const ms = await cloudStore!.myMemberships(s.user.id)
      setMemberships(ms)
      if (ms.length === 0) {
        setTeam(null)
        setMe(null)
        setStatus('no_team')
        return
      }
      const wanted = localStorage.getItem(CLOUD_TEAM_KEY)
      const chosen = ms.find((m) => m.team_id === wanted) ?? ms[0]
      const { team: t, ...member } = chosen
      setTeam(t)
      setMe(member)
      setStatus('ready')
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
      setStatus('no_team')
    }
  }, [])

  const refresh = useCallback(async () => {
    if (localStore) return loadLocal()
    const { data } = await cloudStore!.client.auth.getSession()
    return loadCloud(data.session)
  }, [loadCloud, loadLocal])

  useEffect(() => {
    if (localStore) {
      void loadLocal()
      return
    }
    const client = cloudStore!.client
    void client.auth.getSession().then(({ data }) => loadCloud(data.session))
    const { data: sub } = client.auth.onAuthStateChange((event, s) => {
      if (event === 'SIGNED_IN' || event === 'SIGNED_OUT' || event === 'USER_UPDATED') {
        // Defer: Supabase warns against awaiting client calls inside this callback.
        setTimeout(() => void loadCloud(s), 0)
      }
    })
    return () => sub.subscription.unsubscribe()
  }, [loadCloud, loadLocal])

  const selectTeam = useCallback(
    (teamId: string) => {
      localStorage.setItem(CLOUD_TEAM_KEY, teamId)
      void refresh()
    },
    [refresh],
  )

  const signOut = useCallback(async () => {
    if (cloudStore) await cloudStore.client.auth.signOut()
  }, [])

  const value = useMemo<AppContextValue>(
    () => ({
      status,
      mode: localStore ? 'local' : 'cloud',
      store: (localStore ?? cloudStore)!,
      localStore,
      cloudStore,
      session,
      team,
      me,
      memberships,
      canEdit: localStore ? true : me?.role === 'student',
      error,
      selectTeam,
      refresh,
      setTeam,
      signOut,
    }),
    [status, session, team, me, memberships, error, selectTeam, refresh, signOut],
  )

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp outside AppProvider')
  return ctx
}

/** For pages rendered only once a team is loaded. */
export function useTeam(): AppContextValue & { team: Team } {
  const ctx = useApp()
  if (!ctx.team) throw new Error('useTeam without a team')
  return ctx as AppContextValue & { team: Team }
}
