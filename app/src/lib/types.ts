export type Metric = 'profit' | 'net_worth' | 'points'
export type RoundKind = 'practice' | 'round1' | 'round2' | 'icdc'
export type AttemptStatus = 'in_progress' | 'completed' | 'aborted' | 'bad_data'
export type Verdict = 'keep' | 'discard' | 'inconclusive'
export type Role = 'student' | 'advisor'
export type CompetitionMode = 'auto' | 'on' | 'off'

export interface Team {
  id: string
  name: string
  track: string
  business_type: string | null
  competition_mode: CompetitionMode
  decision_keys: string[]
  join_code?: string | null
  created_at: string
}

export interface Member {
  id: string
  team_id: string
  user_id: string | null
  display_name: string
  role: Role
  created_at: string
}

export interface Round {
  id: string
  team_id: string
  season: string
  kind: RoundKind
  label: string
  opens_at: string | null
  closes_at: string | null
  ranking_metric: Metric
  metric_verified: boolean
  est_qualifying_cutoff: number | null
  notes: string | null
  created_at: string
}

export interface RoundWindow {
  id: string
  team_id: string
  round_id: string
  label: string
  opens_at: string
  closes_at: string
  verified: boolean
  created_at: string
}

export interface DecisionEntry {
  key: string
  value: string
}

export interface Attempt {
  id: string
  team_id: string
  round_id: string
  window_id: string | null
  operator_id: string | null
  parent_attempt_id: string | null
  backlog_id: string | null
  business_type: string | null
  hypothesis: string
  variables_changed: string[]
  decisions: DecisionEntry[]
  status: AttemptStatus
  final_profit: number | null
  final_net_worth: number | null
  final_points: number | null
  cash_low_point: number | null
  loan_taken: boolean | null
  sim_periods_completed: number | null
  minutes_spent: number | null
  verdict: Verdict | null
  lesson: string | null
  tags: string[]
  started_at: string
  finished_at: string | null
  created_at: string
}

export interface BacklogItem {
  id: string
  team_id: string
  idea: string
  variable: string | null
  priority: number
  status: 'queued' | 'tested' | 'dropped'
  tested_attempt_id: string | null
  created_at: string
}

export interface TimeLog {
  id: string
  team_id: string
  member_id: string | null
  round_id: string | null
  minutes: number
  logged_on: string
  note: string | null
  created_at: string
}

export interface LeaderboardSnapshot {
  id: string
  team_id: string
  round_id: string
  captured_at: string
  our_rank_region: number | null
  our_best: number | null
  cutoff_rank2_score: number | null
  note: string | null
  created_at: string
}

export interface ChecklistItem {
  id: string
  team_id: string
  round_id: string
  text: string
  done: boolean
  position: number
  created_at: string
}

export interface TableRows {
  members: Member
  rounds: Round
  round_windows: RoundWindow
  attempts: Attempt
  backlog: BacklogItem
  time_logs: TimeLog
  leaderboard_snapshots: LeaderboardSnapshot
  checklist_items: ChecklistItem
}

export type TableName = keyof TableRows

export const TABLES: TableName[] = [
  'members',
  'rounds',
  'round_windows',
  'attempts',
  'backlog',
  'time_logs',
  'leaderboard_snapshots',
  'checklist_items',
]
