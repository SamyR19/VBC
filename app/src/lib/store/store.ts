import type { TableName, TableRows, Team } from '../types'

export type Row<T extends TableName> = TableRows[T]
export type NewRow<T extends TableName> = Omit<Row<T>, 'created_at'> & { created_at?: string }

/**
 * Storage backend. Every row carries a client-generated `id` and the owning `team_id`,
 * so the same code works against localStorage and Supabase.
 */
export interface Store {
  readonly mode: 'local' | 'cloud'
  list<T extends TableName>(table: T, teamId: string): Promise<Row<T>[]>
  insert<T extends TableName>(table: T, row: NewRow<T>): Promise<Row<T>>
  insertMany<T extends TableName>(table: T, rows: NewRow<T>[]): Promise<void>
  update<T extends TableName>(table: T, id: string, patch: Partial<Row<T>>): Promise<Row<T>>
  remove(table: TableName, id: string): Promise<void>
  getTeam(teamId: string): Promise<Team | null>
  updateTeam(teamId: string, patch: Partial<Team>): Promise<Team>
}

export function newId(): string {
  return crypto.randomUUID()
}

export function nowIso(): string {
  return new Date().toISOString()
}
