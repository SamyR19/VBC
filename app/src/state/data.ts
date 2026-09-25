import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useMemo, useState } from 'react'
import { defaultRound } from '../lib/metrics'
import type { NewRow, Row } from '../lib/store/store'
import type { Member, Round, TableName } from '../lib/types'
import { useTeam } from './app'

export function useRows<T extends TableName>(table: T) {
  const { store, team } = useTeam()
  return useQuery({
    queryKey: ['rows', team.id, table],
    queryFn: () => store.list(table, team.id),
  })
}

export function useMutations<T extends TableName>(table: T) {
  const { store, team } = useTeam()
  const qc = useQueryClient()
  const key = ['rows', team.id, table]
  const invalidate = () => qc.invalidateQueries({ queryKey: key })

  const insert = useMutation({
    mutationFn: (row: Omit<NewRow<T>, 'team_id'>) => store.insert(table, { ...row, team_id: team.id } as NewRow<T>),
    onSuccess: invalidate,
  })
  // Optimistic: patch the cached rows immediately, roll back on error.
  const update = useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<Row<T>> }) => store.update(table, id, patch),
    onMutate: async ({ id, patch }) => {
      await qc.cancelQueries({ queryKey: key })
      const previous = qc.getQueryData<Row<T>[]>(key)
      qc.setQueryData<Row<T>[]>(key, (rows) => rows?.map((r) => (r.id === id ? { ...r, ...patch } : r)))
      return { previous }
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.previous) qc.setQueryData(key, ctx.previous)
    },
    onSettled: invalidate,
  })
  const remove = useMutation({
    mutationFn: (id: string) => store.remove(table, id),
    onSuccess: invalidate,
  })
  return { insert, update, remove }
}

export function useInvalidateAll() {
  const { team } = useTeam()
  const qc = useQueryClient()
  return () => qc.invalidateQueries({ queryKey: ['rows', team.id] })
}

/** Ticks every `ms` so countdowns and "open now" states stay fresh. */
export function useNow(ms = 30_000): Date {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), ms)
    return () => clearInterval(t)
  }, [ms])
  return now
}

const roundKey = (teamId: string) => `vbc:round:${teamId}`

/** The round the team is focused on — remembered per device, defaulting to the open round. */
export function useActiveRound(): {
  rounds: Round[]
  round: Round | null
  setRoundId: (id: string) => void
  isLoading: boolean
} {
  const { team } = useTeam()
  const { data: rounds = [], isLoading } = useRows('rounds')
  const [stored, setStored] = useState<string | null>(() => localStorage.getItem(roundKey(team.id)))
  const sorted = useMemo(
    () =>
      [...rounds].sort(
        (a, b) => (a.opens_at ?? '').localeCompare(b.opens_at ?? '') || a.label.localeCompare(b.label),
      ),
    [rounds],
  )
  const round = sorted.find((r) => r.id === stored) ?? defaultRound(sorted, new Date())
  const setRoundId = (id: string) => {
    localStorage.setItem(roundKey(team.id), id)
    setStored(id)
    window.dispatchEvent(new Event('vbc-round-change'))
  }
  useEffect(() => {
    const sync = () => setStored(localStorage.getItem(roundKey(team.id)))
    window.addEventListener('vbc-round-change', sync)
    return () => window.removeEventListener('vbc-round-change', sync)
  }, [team.id])
  return { rounds: sorted, round, setRoundId, isLoading }
}

export function useMemberName(): (id: string | null) => string {
  const { data: members = [] } = useRows('members')
  return (id) => (id ? (members.find((m: Member) => m.id === id)?.display_name ?? 'Unknown') : '—')
}
