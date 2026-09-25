import type { Metric, Round, RoundWindow } from './types'

// The 20 Virtual Business Entrepreneurship businesses as listed by Knowledge Matters.
export const BUSINESS_TYPES = [
  'Auto repair',
  'Batting cage',
  'Bowling alley',
  'Burrito restaurant',
  'Catering',
  'Coffee shop',
  'DJ services',
  'Electrical',
  'Fitness center',
  'Go-kart track',
  'Hair salon',
  'Ice cream shop',
  'Lawn care',
  'Online gift baskets',
  'Physical therapy',
  'Pizza place',
  'Plumbing',
  'Smoothie shop',
  'T-shirt printing',
  'Trampoline park',
]

// Starting suggestions only. The sim's real decision screens are undocumented,
// so teams should rename these after their first practice session.
export const DEFAULT_DECISION_KEYS = [
  'Price',
  'Marketing budget',
  'Marketing channel',
  'Employees',
  'Wage',
  'Loan amount',
  'Investor equity',
  'Locations',
  'Expansion timing',
]

export const METRIC_LABELS: Record<Metric, string> = {
  profit: 'Cumulative profit',
  net_worth: 'Net worth',
  points: 'Points',
}

export const DEFAULT_CHECKLIST = [
  'Correct competition file / round selected in the sim',
  'Advisor approval confirmed on Knowledge Matters',
  'No browser extensions, overlays or other apps running on the sim device',
  'This tracker is closed on the sim device (log after the run, or on another device)',
  'Roles set: operator runs the sim, analyst takes notes on paper',
  "Today's hypothesis written before starting",
  'Best-run decisions available (printed or on another device)',
  'Time block protected — no interruptions',
  'After the session: log the attempt and the leaderboard rank',
]

type SeedRound = Omit<Round, 'id' | 'team_id' | 'created_at'> & {
  windows: Omit<RoundWindow, 'id' | 'team_id' | 'round_id' | 'created_at'>[]
}

// 2026-27 calendar as reported by DECA Direct and the 2026-27 VBC guide (via
// search snippets — verify against the official PDF). Times are stored in UTC.
// Round windows open 10:00 a.m. ET and close 5:00 p.m. ET.
// Mini-challenge windows were quoted for the Accounting track, so they start
// unverified for Entrepreneurship.
export const SEASON_2026_27: SeedRound[] = [
  {
    season: '2026-27',
    kind: 'practice',
    label: 'Practice',
    opens_at: null,
    closes_at: null,
    ranking_metric: 'profit',
    metric_verified: false,
    est_qualifying_cutoff: null,
    notes: 'Classroom / practice runs. No leaderboard.',
    windows: [],
  },
  {
    season: '2026-27',
    kind: 'round1',
    label: 'Round 1',
    opens_at: '2026-10-13T14:00:00Z',
    closes_at: '2026-10-23T21:00:00Z',
    ranking_metric: 'profit',
    metric_verified: false,
    est_qualifying_cutoff: null,
    notes: 'Top 2 per region advance; max one team per chapter per track per round.',
    windows: [
      { label: 'Mini-challenge 1', opens_at: '2026-10-15T00:30:00Z', closes_at: '2026-10-15T21:00:00Z', verified: false },
      { label: 'Mini-challenge 2', opens_at: '2026-10-20T00:30:00Z', closes_at: '2026-10-20T21:00:00Z', verified: false },
      { label: 'Mini-challenge 3', opens_at: '2026-10-22T00:30:00Z', closes_at: '2026-10-22T21:00:00Z', verified: false },
    ],
  },
  {
    season: '2026-27',
    kind: 'round2',
    label: 'Round 2',
    opens_at: '2027-01-12T15:00:00Z',
    closes_at: '2027-01-22T22:00:00Z',
    ranking_metric: 'profit',
    metric_verified: false,
    est_qualifying_cutoff: null,
    notes: 'Top 2 per region advance; max one team per chapter per track per round.',
    windows: [
      { label: 'Mini-challenge 1', opens_at: '2027-01-13T01:30:00Z', closes_at: '2027-01-13T22:00:00Z', verified: false },
      { label: 'Mini-challenge 2', opens_at: '2027-01-15T01:30:00Z', closes_at: '2027-01-15T22:00:00Z', verified: false },
      { label: 'Mini-challenge 3', opens_at: '2027-01-21T01:30:00Z', closes_at: '2027-01-21T22:00:00Z', verified: false },
    ],
  },
  {
    season: '2026-27',
    kind: 'icdc',
    label: 'ICDC 2027 (Anaheim)',
    opens_at: '2027-04-17T07:00:00Z',
    closes_at: '2027-04-21T06:59:00Z',
    ranking_metric: 'points',
    metric_verified: false,
    est_qualifying_cutoff: null,
    notes: 'Reported: two ~15-minute live sessions, ranked on the combined total. Dates from state DECA pages.',
    windows: [],
  },
]
