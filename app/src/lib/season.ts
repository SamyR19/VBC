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

// ---- Structured decision template ----
// The sim's exact screens are not publicly documented, so these fields follow the decision
// areas Knowledge Matters lists for VB Entrepreneurship (financing, team, resources, pricing,
// marketing, operations, expansion). Leave a field blank if the sim doesn't ask for it, and
// add your own rows under "Other" for anything missing.

export interface DecisionField {
  key: string
  hint: string
  placeholder?: string
}

export interface DecisionGroup {
  group: string
  why: string
  fields: DecisionField[]
}

export const DECISION_TEMPLATE: DecisionGroup[] = [
  {
    group: 'Financing',
    why: 'How you paid to start. Loans add interest costs; investors take part of your ownership (net worth).',
    fields: [
      { key: 'Personal savings invested', hint: 'Dollars of your own money put into the business at the start.', placeholder: '$20,000' },
      { key: 'Bank loan amount', hint: 'Total borrowed from the bank. 0 if none.', placeholder: '$50,000' },
      { key: 'Loan interest rate', hint: 'Annual rate shown when you took the loan.', placeholder: '7%' },
      { key: 'Loan term', hint: 'How long until the loan must be repaid.', placeholder: '5 years' },
      { key: 'Investor money raised', hint: 'Cash from investors (equity or debt).', placeholder: '$25,000' },
      { key: 'Equity given to investors', hint: 'Percent of the business investors own in return.', placeholder: '20%' },
    ],
  },
  {
    group: 'Location & resources',
    why: 'Where you operate and what you buy to run. Drives rent, capacity and fixed costs.',
    fields: [
      { key: 'Location', hint: 'Which site/neighborhood you picked.', placeholder: 'Downtown' },
      { key: 'Rent', hint: 'Rent per period as shown in the sim.', placeholder: '$3,000/month' },
      { key: 'Equipment purchased', hint: 'Main equipment or upgrades bought, with cost.', placeholder: '2 blenders, $1,200' },
      { key: 'Supplies / inventory ordered', hint: 'Starting supplies or reorder amount.', placeholder: '500 units' },
    ],
  },
  {
    group: 'Staffing',
    why: 'Your team. Too few staff loses customers; too many or overpaid staff eats profit.',
    fields: [
      { key: 'Employees', hint: 'Number of people hired at the start (change later runs one at a time).', placeholder: '3' },
      { key: 'Wage', hint: 'Hourly pay offered. Research suggests fair wages attract better employees.', placeholder: '$15/hr' },
      { key: 'Hours / shifts', hint: 'Scheduled hours or shift pattern.', placeholder: '2 shifts, 40 hrs each' },
      { key: 'Hiring notes', hint: 'Who you picked and why (skills, references).', placeholder: 'Picked 2 with experience' },
    ],
  },
  {
    group: 'Pricing',
    why: 'The most direct lever on profit. Change it in small steps and record the exact number.',
    fields: [
      { key: 'Main price', hint: 'Price of your core product/service.', placeholder: '$5.50' },
      { key: 'Premium / tier price', hint: 'Higher tier or add-on price if the sim offers tiers.', placeholder: '$7.00' },
      { key: 'Discounts / promotions', hint: 'Any sale, coupon or bundle you ran, and when.', placeholder: '10% off Year 1 Q1' },
    ],
  },
  {
    group: 'Marketing',
    why: 'Brings customers in. Record spend per period and which channels, so you can compare runs.',
    fields: [
      { key: 'Marketing budget', hint: 'Spend per period.', placeholder: '$800/month' },
      { key: 'Marketing channels', hint: 'Where you advertised.', placeholder: 'Social, flyers' },
      { key: 'Target customer', hint: 'Who the ads aimed at, if the sim asks.', placeholder: 'Students' },
    ],
  },
  {
    group: 'Operations',
    why: 'Day-to-day running: hours, quality, workflow. Affects satisfaction and costs.',
    fields: [
      { key: 'Hours open', hint: 'Opening hours or days per week.', placeholder: '7am–7pm, 7 days' },
      { key: 'Quality / service level', hint: 'Any quality setting or product mix choice.', placeholder: 'Premium ingredients' },
      { key: 'Workflow changes', hint: 'Changes made to employee tasks during the run.', placeholder: 'Moved 1 staff to register' },
    ],
  },
  {
    group: 'Expansion',
    why: 'Adding businesses or locations can multiply profit but costs cash — timing matters.',
    fields: [
      { key: 'Expansion timing', hint: 'When you expanded (sim year/period).', placeholder: 'Start of Year 3' },
      { key: 'What was added', hint: 'New location or new business type.', placeholder: '2nd smoothie shop, uptown' },
      { key: 'Locations at end', hint: 'Total locations/businesses when the run ended.', placeholder: '2' },
    ],
  },
]

export const TEMPLATE_KEYS = new Set(DECISION_TEMPLATE.flatMap((g) => g.fields.map((f) => f.key.toLowerCase())))

export const IDEA_CATEGORIES = [...DECISION_TEMPLATE.map((g) => g.group), 'Timing', 'Other']

export const DEFAULT_PERIODS = ['Year 1', 'Year 2', 'Year 3', 'Year 4', 'Year 5']
