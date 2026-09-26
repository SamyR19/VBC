import type { Attempt, DecisionEntry, Metric, Round, RoundWindow, Team } from './types'

export function scoreOf(a: Attempt, metric: Metric): number | null {
  switch (metric) {
    case 'profit':
      return a.final_profit
    case 'net_worth':
      return a.final_net_worth
    case 'points':
      return a.final_points
  }
}

/** Attempts that count toward a personal best: completed, with a score for the metric. */
export function isScored(a: Attempt, metric: Metric): boolean {
  return a.status === 'completed' && scoreOf(a, metric) != null
}

function byTime(a: Attempt, b: Attempt): number {
  return a.started_at.localeCompare(b.started_at) || a.created_at.localeCompare(b.created_at)
}

export function personalBest(attempts: Attempt[], metric: Metric): Attempt | null {
  let best: Attempt | null = null
  for (const a of [...attempts].sort(byTime)) {
    if (!isScored(a, metric)) continue
    if (!best || (scoreOf(a, metric) as number) > (scoreOf(best, metric) as number)) best = a
  }
  return best
}

/** Best scored attempt that started before `attempt` (used for "new PB by +X"). */
export function bestBefore(attempts: Attempt[], attempt: Attempt, metric: Metric): Attempt | null {
  const earlier = attempts.filter((a) => a.id !== attempt.id && byTime(a, attempt) < 0)
  return personalBest(earlier, metric)
}

/** Best scored attempt other than `attempt` itself, any time. */
export function bestExcluding(attempts: Attempt[], attempt: Attempt, metric: Metric): Attempt | null {
  return personalBest(
    attempts.filter((a) => a.id !== attempt.id),
    metric,
  )
}

export interface ProgressPoint {
  n: number
  id: string
  score: number
  best: number
  label: string
}

/** Chronological scores with a running best, for the progress chart. */
export function progressSeries(attempts: Attempt[], metric: Metric): ProgressPoint[] {
  const out: ProgressPoint[] = []
  let best = -Infinity
  for (const a of [...attempts].sort(byTime)) {
    if (!isScored(a, metric)) continue
    const s = scoreOf(a, metric) as number
    best = Math.max(best, s)
    out.push({ n: out.length + 1, id: a.id, score: s, best, label: a.hypothesis })
  }
  return out
}

export type DiffKind = 'changed' | 'added' | 'removed' | 'same'
export interface DiffRow {
  key: string
  before: string | null
  after: string | null
  kind: DiffKind
}

const norm = (s: string) => s.trim().toLowerCase()

export function diffDecisions(before: DecisionEntry[], after: DecisionEntry[]): DiffRow[] {
  const beforeMap = new Map<string, DecisionEntry>()
  for (const d of before) if (d.key.trim()) beforeMap.set(norm(d.key), d)
  const rows: DiffRow[] = []
  const seen = new Set<string>()
  for (const d of after) {
    if (!d.key.trim()) continue
    const k = norm(d.key)
    if (seen.has(k)) continue
    seen.add(k)
    const prev = beforeMap.get(k)
    if (!prev) rows.push({ key: d.key.trim(), before: null, after: d.value, kind: 'added' })
    else if (prev.value.trim() !== d.value.trim())
      rows.push({ key: d.key.trim(), before: prev.value, after: d.value, kind: 'changed' })
    else rows.push({ key: d.key.trim(), before: prev.value, after: d.value, kind: 'same' })
  }
  for (const [k, d] of beforeMap) {
    if (!seen.has(k)) rows.push({ key: d.key.trim(), before: d.value, after: null, kind: 'removed' })
  }
  return rows
}

export function changedKeys(before: DecisionEntry[], after: DecisionEntry[]): string[] {
  return diffDecisions(before, after)
    .filter((r) => r.kind !== 'same')
    .map((r) => r.key)
}

export function formatMoney(n: number | null | undefined): string {
  if (n == null) return '—'
  return n.toLocaleString(undefined, { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })
}

export function formatScore(n: number | null | undefined, metric: Metric): string {
  if (n == null) return '—'
  return metric === 'points' ? n.toLocaleString() : formatMoney(n)
}

export function formatDelta(n: number | null | undefined, metric: Metric): string {
  if (n == null) return '—'
  const sign = n > 0 ? '+' : n < 0 ? '−' : '±'
  return sign + formatScore(Math.abs(n), metric)
}

export function pctDelta(value: number, base: number): number | null {
  if (base === 0) return null
  return ((value - base) / Math.abs(base)) * 100
}

// ---- Round timing ----

export type Phase = 'upcoming' | 'open' | 'closed' | 'always'

export function roundPhase(r: Pick<Round, 'opens_at' | 'closes_at'>, now: Date): Phase {
  if (!r.opens_at || !r.closes_at) return 'always'
  const t = now.getTime()
  if (t < Date.parse(r.opens_at)) return 'upcoming'
  if (t <= Date.parse(r.closes_at)) return 'open'
  return 'closed'
}

/** The round a team is most likely working on right now. */
export function defaultRound(rounds: Round[], now: Date): Round | null {
  if (rounds.length === 0) return null
  const competitive = rounds.filter((r) => r.kind !== 'practice' && r.opens_at && r.closes_at)
  const open = competitive.find((r) => roundPhase(r, now) === 'open')
  if (open) return open
  return rounds.find((r) => r.kind === 'practice') ?? rounds[0]
}

export function nextEvent(
  rounds: Round[],
  now: Date,
): { round: Round; kind: 'opens' | 'closes'; at: string } | null {
  let best: { round: Round; kind: 'opens' | 'closes'; at: string } | null = null
  for (const r of rounds) {
    if (!r.opens_at || !r.closes_at) continue
    const phase = roundPhase(r, now)
    const candidate =
      phase === 'upcoming'
        ? { round: r, kind: 'opens' as const, at: r.opens_at }
        : phase === 'open'
          ? { round: r, kind: 'closes' as const, at: r.closes_at }
          : null
    if (candidate && (!best || candidate.at < best.at)) best = candidate
  }
  return best
}

export function openWindow(windows: RoundWindow[], now: Date): RoundWindow | null {
  return windows.find((w) => roundPhase(w, now) === 'open') ?? null
}

export function competitionActive(team: Team, rounds: Round[], windows: RoundWindow[], now: Date): boolean {
  if (team.competition_mode === 'on') return true
  if (team.competition_mode === 'off') return false
  const liveRound = rounds.some((r) => r.kind !== 'practice' && roundPhase(r, now) === 'open')
  return liveRound || openWindow(windows, now) != null
}

// ---- What's working: effect of each changed decision ----

export interface VariableEffect {
  key: string
  /** Runs where this was the ONLY change vs. the baseline (clean evidence). */
  cleanRuns: number
  /** Runs where it changed together with other decisions (confounded). */
  mixedRuns: number
  /** Average score change vs. baseline across clean runs. */
  avgDelta: number | null
  bestDelta: number | null
  worstDelta: number | null
  improved: number
  /** Most recent clean change, e.g. "5.00 → 5.50: +$2,500". */
  examples: { attemptId: string; before: string | null; after: string | null; delta: number }[]
}

/**
 * For every decision that changed between a run and its baseline, summarise how the score moved.
 * Only single-change runs count as clean evidence; multi-change runs are counted but not averaged.
 */
export function variableEffects(attempts: Attempt[], metric: Metric): VariableEffect[] {
  const byId = new Map(attempts.map((a) => [a.id, a]))
  const acc = new Map<string, VariableEffect & { deltas: number[] }>()
  const get = (key: string) => {
    const k = key.trim().toLowerCase()
    let e = acc.get(k)
    if (!e) {
      e = { key: key.trim(), cleanRuns: 0, mixedRuns: 0, avgDelta: null, bestDelta: null, worstDelta: null, improved: 0, examples: [], deltas: [] }
      acc.set(k, e)
    }
    return e
  }
  for (const a of [...attempts].sort(byTime)) {
    if (!isScored(a, metric) || !a.parent_attempt_id) continue
    const base = byId.get(a.parent_attempt_id)
    if (!base || !isScored(base, metric)) continue
    const rows = diffDecisions(base.decisions, a.decisions).filter((r) => r.kind !== 'same')
    if (rows.length === 0) continue
    const delta = (scoreOf(a, metric) as number) - (scoreOf(base, metric) as number)
    if (rows.length > 1) {
      for (const r of rows) get(r.key).mixedRuns++
      continue
    }
    const e = get(rows[0].key)
    e.cleanRuns++
    e.deltas.push(delta)
    if (delta > 0) e.improved++
    e.examples.unshift({ attemptId: a.id, before: rows[0].before, after: rows[0].after, delta })
  }
  return [...acc.values()]
    .map(({ deltas, ...e }) => ({
      ...e,
      avgDelta: deltas.length ? deltas.reduce((s, d) => s + d, 0) / deltas.length : null,
      bestDelta: deltas.length ? Math.max(...deltas) : null,
      worstDelta: deltas.length ? Math.min(...deltas) : null,
      examples: e.examples.slice(0, 3),
    }))
    .sort((x, y) => (y.avgDelta ?? -Infinity) - (x.avgDelta ?? -Infinity) || y.cleanRuns - x.cleanRuns)
}

export interface RunStats {
  count: number
  scored: number
  best: number | null
  mean: number | null
  median: number | null
  minutes: number
}

export function runStats(attempts: Attempt[], metric: Metric): RunStats {
  const scores = attempts.filter((a) => isScored(a, metric)).map((a) => scoreOf(a, metric) as number).sort((a, b) => a - b)
  const mid = Math.floor(scores.length / 2)
  return {
    count: attempts.length,
    scored: scores.length,
    best: scores.length ? scores[scores.length - 1] : null,
    mean: scores.length ? scores.reduce((s, x) => s + x, 0) / scores.length : null,
    median: scores.length ? (scores.length % 2 ? scores[mid] : (scores[mid - 1] + scores[mid]) / 2) : null,
    minutes: attempts.reduce((s, a) => s + (a.minutes_spent ?? 0), 0),
  }
}
