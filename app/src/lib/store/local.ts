import type { TableName, Team } from '../types'
import { nowIso, type NewRow, type Row, type Store } from './store'

const PREFIX = 'vbc:'

export interface KV {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
  removeItem(key: string): void
}

/** Browser-only store: everything lives in localStorage on this device. */
export class LocalStore implements Store {
  readonly mode = 'local' as const
  private kv: KV

  constructor(kv: KV = window.localStorage) {
    this.kv = kv
  }

  private read<T>(key: string, fallback: T): T {
    const raw = this.kv.getItem(PREFIX + key)
    if (!raw) return fallback
    try {
      return JSON.parse(raw) as T
    } catch {
      return fallback
    }
  }

  private write(key: string, value: unknown) {
    this.kv.setItem(PREFIX + key, JSON.stringify(value))
  }

  private rows<T extends TableName>(table: T): Row<T>[] {
    return this.read<Row<T>[]>(table, [])
  }

  async list<T extends TableName>(table: T, teamId: string): Promise<Row<T>[]> {
    return this.rows(table).filter((r) => r.team_id === teamId)
  }

  async insert<T extends TableName>(table: T, row: NewRow<T>): Promise<Row<T>> {
    const full = { created_at: nowIso(), ...row } as Row<T>
    const all = this.rows(table)
    if (all.some((r) => r.id === full.id)) throw new Error(`Duplicate id in ${table}`)
    all.push(full)
    this.write(table, all)
    return full
  }

  async insertMany<T extends TableName>(table: T, rows: NewRow<T>[]): Promise<void> {
    const all = this.rows(table)
    const ts = nowIso()
    for (const row of rows) all.push({ created_at: ts, ...row } as Row<T>)
    this.write(table, all)
  }

  async update<T extends TableName>(table: T, id: string, patch: Partial<Row<T>>): Promise<Row<T>> {
    const all = this.rows(table)
    const i = all.findIndex((r) => r.id === id)
    if (i < 0) throw new Error(`Not found: ${table} ${id}`)
    all[i] = { ...all[i], ...patch, id }
    this.write(table, all)
    return all[i]
  }

  async remove(table: TableName, id: string): Promise<void> {
    this.write(
      table,
      this.rows(table).filter((r) => r.id !== id),
    )
  }

  async getTeam(teamId: string): Promise<Team | null> {
    return this.read<Team[]>('teams', []).find((t) => t.id === teamId) ?? null
  }

  async updateTeam(teamId: string, patch: Partial<Team>): Promise<Team> {
    const teams = this.read<Team[]>('teams', [])
    const i = teams.findIndex((t) => t.id === teamId)
    if (i < 0) throw new Error('Team not found')
    teams[i] = { ...teams[i], ...patch, id: teamId }
    this.write('teams', teams)
    return teams[i]
  }

  // ---- local-only helpers ----

  async createTeam(team: Team): Promise<Team> {
    const teams = this.read<Team[]>('teams', [])
    teams.push(team)
    this.write('teams', teams)
    this.kv.setItem(PREFIX + 'currentTeam', team.id)
    return team
  }

  currentTeamId(): string | null {
    const id = this.kv.getItem(PREFIX + 'currentTeam')
    if (!id) return null
    return this.read<Team[]>('teams', []).some((t) => t.id === id) ? id : null
  }

  /** Wipe every table on this device. */
  clearAll() {
    for (const key of ['teams', 'currentTeam', 'members', 'rounds', 'round_windows', 'attempts', 'backlog', 'time_logs', 'leaderboard_snapshots', 'checklist_items'])
      this.kv.removeItem(PREFIX + key)
  }
}
