import type { Attempt } from './types'

let seq = 0
export function makeAttempt(p: Partial<Attempt> = {}): Attempt {
  seq++
  const t = new Date(Date.UTC(2026, 9, 13, 14, seq)).toISOString()
  return {
    id: `a${seq}`,
    team_id: 't',
    round_id: 'r',
    window_id: null,
    operator_id: null,
    parent_attempt_id: null,
    backlog_id: null,
    business_type: null,
    hypothesis: `run ${seq}`,
    variables_changed: [],
    decisions: [],
    status: 'completed',
    final_profit: null,
    final_net_worth: null,
    final_points: null,
    cash_low_point: null,
    loan_taken: null,
    sim_periods_completed: null,
    minutes_spent: null,
    verdict: null,
    lesson: null,
    tags: [],
    started_at: t,
    finished_at: t,
    created_at: t,
    ...p,
  }
}

export class MemoryKV {
  map = new Map<string, string>()
  getItem(k: string) {
    return this.map.get(k) ?? null
  }
  setItem(k: string, v: string) {
    this.map.set(k, v)
  }
  removeItem(k: string) {
    this.map.delete(k)
  }
}
