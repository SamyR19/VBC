import { DEFAULT_CHECKLIST, SEASON_2026_27 } from './season'
import { newId, nowIso, type NewRow, type Store } from './store/store'
import { TABLES, type Attempt, type Round, type TableName, type TableRows, type Team } from './types'

/** Insert the 2026-27 rounds (and their mini-challenge windows) for a new team. */
export async function seedSeason(store: Store, teamId: string): Promise<void> {
  const rounds: NewRow<'rounds'>[] = []
  const windows: NewRow<'round_windows'>[] = []
  for (const seed of SEASON_2026_27) {
    const { windows: seedWindows, ...round } = seed
    const id = newId()
    rounds.push({ ...round, id, team_id: teamId })
    for (const w of seedWindows) windows.push({ ...w, id: newId(), team_id: teamId, round_id: id })
  }
  await store.insertMany('rounds', rounds)
  await store.insertMany('round_windows', windows)
}

export async function seedChecklist(store: Store, teamId: string, roundId: string): Promise<void> {
  await store.insertMany(
    'checklist_items',
    DEFAULT_CHECKLIST.map((text, i) => ({
      id: newId(),
      team_id: teamId,
      round_id: roundId,
      text,
      done: false,
      position: i,
    })),
  )
}

/** Blank detail fields for a new experiment idea. */
export function emptyIdea() {
  return {
    variable: null,
    category: null,
    from_value: null,
    to_value: null,
    expected_effect: null,
    rationale: null,
    effort: null,
    source: 'me' as const,
  }
}

// ---- Backup / restore ----

export interface Backup {
  app: 'vbc-tracker'
  version: 1
  exported_at: string
  team: Team
  tables: { [K in TableName]: TableRows[K][] }
}

export async function exportBackup(store: Store, team: Team): Promise<Backup> {
  const tables = {} as Backup['tables']
  for (const t of TABLES) {
    ;(tables as Record<string, unknown[]>)[t] = await store.list(t, team.id)
  }
  return { app: 'vbc-tracker', version: 1, exported_at: nowIso(), team, tables }
}

// Foreign-key columns that must be remapped when importing into another team.
const REFS: Record<string, string[]> = {
  members: [],
  rounds: [],
  round_windows: ['round_id'],
  attempts: ['round_id', 'window_id', 'operator_id', 'parent_attempt_id', 'backlog_id'],
  backlog: ['tested_attempt_id'],
  time_logs: ['member_id', 'round_id'],
  leaderboard_snapshots: ['round_id'],
  checklist_items: ['round_id'],
}

// Insert order respects references (backlog <-> attempts is handled in two passes).
const IMPORT_ORDER: TableName[] = [
  'members',
  'rounds',
  'round_windows',
  'backlog',
  'attempts',
  'time_logs',
  'leaderboard_snapshots',
  'checklist_items',
]

export function isBackup(x: unknown): x is Backup {
  const b = x as Backup
  return !!b && b.app === 'vbc-tracker' && b.version === 1 && typeof b.tables === 'object'
}

/**
 * Copy every row of a backup into `teamId`, giving each row a fresh id.
 * Rounds that match an existing round (same season + kind) are merged instead of duplicated.
 */
export async function importBackup(store: Store, teamId: string, backup: Backup): Promise<number> {
  const idMap = new Map<string, string>()
  const existingRounds = await store.list('rounds', teamId)
  for (const r of backup.tables.rounds ?? []) {
    const match = existingRounds.find((e) => e.season === r.season && e.kind === r.kind)
    if (match) idMap.set(r.id, match.id)
  }
  const existingMembers = await store.list('members', teamId)
  for (const m of backup.tables.members ?? []) {
    const match = existingMembers.find((e) => e.display_name.trim().toLowerCase() === m.display_name.trim().toLowerCase())
    if (match) idMap.set(m.id, match.id)
  }
  for (const t of IMPORT_ORDER) for (const row of backup.tables[t] ?? []) if (!idMap.has(row.id)) idMap.set(row.id, newId())

  let count = 0
  const deferredBacklog: { id: string; tested_attempt_id: string }[] = []
  for (const t of IMPORT_ORDER) {
    const rows = (backup.tables[t] ?? []) as unknown as Record<string, unknown>[]
    const out: Record<string, unknown>[] = []
    for (const row of rows) {
      if ((t === 'rounds' || t === 'members') && existingRoundsOrMembers(t, row, existingRounds, existingMembers)) continue
      const copy: Record<string, unknown> = { ...row, id: idMap.get(row.id as string), team_id: teamId }
      if (t === 'members') copy.user_id = null
      for (const ref of REFS[t]) {
        const v = copy[ref] as string | null
        copy[ref] = v ? (idMap.get(v) ?? null) : null
      }
      if (t === 'backlog' && copy.tested_attempt_id) {
        deferredBacklog.push({ id: copy.id as string, tested_attempt_id: copy.tested_attempt_id as string })
        copy.tested_attempt_id = null
      }
      out.push(copy)
    }
    await store.insertMany(t, out as never)
    count += out.length
  }
  for (const b of deferredBacklog) await store.update('backlog', b.id, { tested_attempt_id: b.tested_attempt_id })
  return count
}

function existingRoundsOrMembers(
  t: TableName,
  row: Record<string, unknown>,
  rounds: Round[],
  members: { display_name: string }[],
): boolean {
  if (t === 'rounds') return rounds.some((e) => e.season === row.season && e.kind === row.kind)
  return members.some((e) => e.display_name.trim().toLowerCase() === String(row.display_name).trim().toLowerCase())
}

// ---- CSV ----

function csvCell(v: unknown): string {
  if (v == null) return ''
  const s = Array.isArray(v) ? v.join('; ') : String(v)
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

export function attemptsToCsv(
  attempts: Attempt[],
  rounds: Round[],
  memberName: (id: string | null) => string,
): string {
  const roundLabel = (id: string) => rounds.find((r) => r.id === id)?.label ?? ''
  const header = [
    'started_at',
    'round',
    'status',
    'operator',
    'business_type',
    'hypothesis',
    'variables_changed',
    'decisions',
    'final_profit',
    'final_net_worth',
    'final_points',
    'final_revenue',
    'final_expenses',
    'ending_cash',
    'cash_low_point',
    'loan_taken',
    'total_debt',
    'interest_paid',
    'customer_satisfaction',
    'employees',
    'locations',
    'sim_periods_completed',
    'minutes_spent',
    'verdict',
    'run_notes',
    'lesson',
    'tags',
    'checkpoints',
  ]
  const lines = [header.join(',')]
  for (const a of [...attempts].sort((x, y) => x.started_at.localeCompare(y.started_at))) {
    lines.push(
      [
        a.started_at,
        roundLabel(a.round_id),
        a.status,
        memberName(a.operator_id),
        a.business_type,
        a.hypothesis,
        a.variables_changed,
        a.decisions.map((d) => `${d.key}=${d.value}`),
        a.final_profit,
        a.final_net_worth,
        a.final_points,
        a.final_revenue,
        a.final_expenses,
        a.ending_cash,
        a.cash_low_point,
        a.loan_taken,
        a.total_debt,
        a.interest_paid,
        a.customer_satisfaction,
        a.employees,
        a.locations,
        a.sim_periods_completed,
        a.minutes_spent,
        a.verdict,
        a.run_notes,
        a.lesson,
        a.tags,
        (a.checkpoints ?? []).map((c) => `${c.period}: profit ${c.profit ?? ''} / net worth ${c.net_worth ?? ''} / cash ${c.cash ?? ''}`),
      ]
        .map(csvCell)
        .join(','),
    )
  }
  return lines.join('\n') + '\n'
}

export function download(filename: string, content: string, type: string) {
  const blob = new Blob([content], { type })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
