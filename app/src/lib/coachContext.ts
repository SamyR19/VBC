import {
  diffDecisions,
  formatScore,
  personalBest,
  roundPhase,
  runStats,
  scoreOf,
  variableEffects,
} from './metrics'
import { METRIC_LABELS } from './season'
import type { Attempt, BacklogItem, LeaderboardSnapshot, Round, Team } from './types'

export interface CoachInputs {
  team: Team
  round: Round | null
  attempts: Attempt[]
  backlog: BacklogItem[]
  snapshots: LeaderboardSnapshot[]
  page: { label: string; details: string }
  now: Date
}

const money = (n: number | null | undefined) => (n == null ? '—' : `$${Math.round(n).toLocaleString('en-US')}`)

/**
 * Compact, plain-text briefing of the team's data for the AI coach. No personal names are
 * included — only sim numbers, decisions and the team's own notes.
 */
export function buildCoachContext({ team, round, attempts, backlog, snapshots, page, now }: CoachInputs): string {
  const lines: string[] = []
  const metric = round?.ranking_metric ?? 'profit'
  lines.push(`Business: ${team.business_type ?? 'not chosen yet'}`)
  if (round) {
    const phase = roundPhase(round, now)
    lines.push(
      `Active round: ${round.label} (${phase}${round.closes_at && phase === 'open' ? `, closes ${round.closes_at}` : ''}${round.opens_at && phase === 'upcoming' ? `, opens ${round.opens_at}` : ''}). Ranking metric: ${METRIC_LABELS[metric]}${round.metric_verified ? '' : ' (unverified)'}.`,
    )
  }
  lines.push(`Current time: ${now.toISOString()}`)
  lines.push(`User is on page: ${page.label}`)
  if (page.details) lines.push(`Page details:\n${page.details}`)

  const inRound = round ? attempts.filter((a) => a.round_id === round.id) : attempts
  const stats = runStats(inRound, metric)
  lines.push(
    `\nRUNS THIS ROUND: ${stats.count} logged, ${stats.scored} scored. Best ${formatScore(stats.best, metric)}, median ${formatScore(stats.median, metric)}. Time on attempts: ${Math.round(stats.minutes / 6) / 10} h.`,
  )

  const pb = personalBest(inRound, metric)
  if (pb) {
    lines.push(`\nPERSONAL BEST (PB): "${pb.hypothesis}" — ${describeResults(pb)}`)
    lines.push(`PB decisions: ${pb.decisions.map((d) => `${d.group ? `[${d.group}] ` : ''}${d.key} = ${d.value}`).join('; ') || '(none recorded)'}`)
    if (pb.checkpoints?.length) lines.push(`PB by period: ${pb.checkpoints.map((c) => `${c.period}: profit ${money(c.profit)}, cash ${money(c.cash)}`).join(' | ')}`)
  } else {
    lines.push('\nNo scored runs yet in this round.')
  }

  const snap = snapshots
    .filter((s) => !round || s.round_id === round.id)
    .sort((a, b) => b.captured_at.localeCompare(a.captured_at))[0]
  const cutoff = snap?.cutoff_rank2_score ?? round?.est_qualifying_cutoff ?? null
  if (snap || cutoff != null) {
    lines.push(
      `Leaderboard: ${snap ? `regional rank ${snap.our_rank_region ?? '?'} (as of ${snap.captured_at.slice(0, 10)}), ` : ''}qualifying cutoff ≈ ${formatScore(cutoff, metric)}${pb && cutoff != null ? `, gap ${formatScore((scoreOf(pb, metric) ?? 0) - cutoff, metric)}` : ''}.`,
    )
  }

  const effects = variableEffects(inRound, metric)
  if (effects.length) {
    lines.push('\nDECISION EFFECTS (score change vs baseline; only single-change runs are "clean"):')
    for (const e of effects.slice(0, 15)) {
      lines.push(
        `- ${e.key}: ${e.cleanRuns} clean run(s)${e.avgDelta != null ? `, avg ${fmtDelta(e.avgDelta, metric)}, best ${fmtDelta(e.bestDelta, metric)}, worst ${fmtDelta(e.worstDelta, metric)}, improved ${e.improved}/${e.cleanRuns}` : ''}${e.mixedRuns ? `; ${e.mixedRuns} confounded run(s)` : ''}${e.examples[0] ? `; latest ${e.examples[0].before ?? '(blank)'} → ${e.examples[0].after ?? '(removed)'}` : ''}`,
      )
    }
  }

  const byId = new Map(attempts.map((a) => [a.id, a]))
  const recent = [...inRound].sort((a, b) => b.started_at.localeCompare(a.started_at)).slice(0, 15)
  if (recent.length) {
    lines.push('\nRECENT RUNS (newest first):')
    for (const a of recent) {
      const base = a.parent_attempt_id ? byId.get(a.parent_attempt_id) : undefined
      const changes = base
        ? diffDecisions(base.decisions, a.decisions)
            .filter((r) => r.kind !== 'same')
            .map((r) => `${r.key}: ${r.before ?? '(blank)'} → ${r.after ?? '(removed)'}`)
            .join('; ')
        : 'no baseline'
      const s = scoreOf(a, metric)
      const bs = base ? scoreOf(base, metric) : null
      lines.push(
        `- ${a.started_at.slice(0, 10)} [${a.status}${a.verdict ? `, ${a.verdict}` : ''}${a.id === pb?.id ? ', PB' : ''}] "${a.hypothesis}" | changed: ${changes || 'nothing'} | ${METRIC_LABELS[metric]} ${formatScore(s, metric)}${s != null && bs != null ? ` (${fmtDelta(s - bs, metric)} vs baseline)` : ''} | ${describeResults(a)}${a.run_notes ? ` | notes: ${a.run_notes}` : ''}${a.lesson ? ` | lesson: ${a.lesson}` : ''}`,
      )
    }
  }

  const queued = backlog.filter((b) => b.status === 'queued').sort((a, b) => b.priority - a.priority).slice(0, 12)
  if (queued.length) {
    lines.push('\nQUEUED IDEAS (not yet tested):')
    for (const b of queued) lines.push(`- [p${b.priority}${b.category ? `, ${b.category}` : ''}] ${b.idea}${b.variable ? ` (${b.variable}: ${b.from_value || '?'} → ${b.to_value || '?'})` : ''}`)
  }
  const tested = backlog.filter((b) => b.status !== 'queued').slice(0, 10)
  if (tested.length) lines.push(`Already tested/dropped ideas: ${tested.map((b) => `"${b.idea}" (${b.status})`).join('; ')}`)

  return lines.join('\n')
}

function fmtDelta(n: number | null, metric: Round['ranking_metric']): string {
  if (n == null) return '—'
  return `${n >= 0 ? '+' : '−'}${formatScore(Math.abs(n), metric)}`
}

function describeResults(a: Attempt): string {
  const parts = [
    `profit ${money(a.final_profit)}`,
    `net worth ${money(a.final_net_worth)}`,
    a.final_points != null && `points ${a.final_points}`,
    a.final_revenue != null && `revenue ${money(a.final_revenue)}`,
    a.final_expenses != null && `expenses ${money(a.final_expenses)}`,
    a.cash_low_point != null && `lowest cash ${money(a.cash_low_point)}`,
    a.total_debt != null && `debt left ${money(a.total_debt)}`,
    a.customer_satisfaction != null && `satisfaction ${a.customer_satisfaction}%`,
    a.employees != null && `${a.employees} employees`,
    a.locations != null && `${a.locations} locations`,
  ]
  return parts.filter(Boolean).join(', ')
}
