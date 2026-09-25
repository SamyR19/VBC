import type { SupabaseClient } from '@supabase/supabase-js'
import type { Member, Role, TableName, Team } from '../types'
import type { NewRow, Row, Store } from './store'

/** Team store backed by Supabase Postgres. Row-level security scopes every query to the user's teams. */
export class SupabaseStore implements Store {
  readonly mode = 'cloud' as const
  readonly client: SupabaseClient

  constructor(client: SupabaseClient) {
    this.client = client
  }

  async list<T extends TableName>(table: T, teamId: string): Promise<Row<T>[]> {
    const { data, error } = await this.client.from(table).select('*').eq('team_id', teamId)
    if (error) throw error
    return data as Row<T>[]
  }

  async insert<T extends TableName>(table: T, row: NewRow<T>): Promise<Row<T>> {
    const { data, error } = await this.client.from(table).insert(row).select().single()
    if (error) throw error
    return data as Row<T>
  }

  async insertMany<T extends TableName>(table: T, rows: NewRow<T>[]): Promise<void> {
    if (rows.length === 0) return
    const { error } = await this.client.from(table).insert(rows)
    if (error) throw error
  }

  async update<T extends TableName>(table: T, id: string, patch: Partial<Row<T>>): Promise<Row<T>> {
    const clean: Record<string, unknown> = { ...patch }
    delete clean.id
    delete clean.team_id
    delete clean.created_at
    if (table === 'members') {
      // Only these member columns are writable (see migration grants).
      for (const k of Object.keys(clean)) if (k !== 'display_name' && k !== 'role') delete clean[k]
    }
    const { data, error } = await this.client.from(table).update(clean).eq('id', id).select().single()
    if (error) throw error
    return data as Row<T>
  }

  async remove(table: TableName, id: string): Promise<void> {
    const { error } = await this.client.from(table).delete().eq('id', id)
    if (error) throw error
  }

  async getTeam(teamId: string): Promise<Team | null> {
    const { data, error } = await this.client.from('teams').select('*').eq('id', teamId).maybeSingle()
    if (error) throw error
    return data as Team | null
  }

  async updateTeam(teamId: string, patch: Partial<Team>): Promise<Team> {
    const clean: Record<string, unknown> = { ...patch }
    for (const k of ['id', 'created_at', 'join_code', 'track']) delete clean[k]
    const { data, error } = await this.client.from('teams').update(clean).eq('id', teamId).select().single()
    if (error) throw error
    return data as Team
  }

  // ---- cloud-only helpers ----

  async myMemberships(userId: string): Promise<(Member & { team: Team })[]> {
    const { data, error } = await this.client.from('members').select('*, team:teams(*)').eq('user_id', userId)
    if (error) throw error
    return data as (Member & { team: Team })[]
  }

  async createTeam(name: string, displayName: string, ageOk: boolean): Promise<string> {
    const { data, error } = await this.client.rpc('create_team', {
      p_name: name,
      p_display_name: displayName,
      p_age_ok: ageOk,
    })
    if (error) throw error
    return data as string
  }

  async joinTeam(code: string, displayName: string, role: Role, ageOk: boolean): Promise<string> {
    const { data, error } = await this.client.rpc('join_team', {
      p_code: code,
      p_display_name: displayName,
      p_role: role,
      p_age_ok: ageOk,
    })
    if (error) throw error
    return data as string
  }

  async rotateJoinCode(teamId: string): Promise<string> {
    const { data, error } = await this.client.rpc('rotate_join_code', { p_team: teamId })
    if (error) throw error
    return data as string
  }
}
