import { Fragment, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Card, Delta, ErrorNote, PageHeader, PbBadge, Spinner, StatusChip } from '../components/ui'
import {
  bestBefore,
  bestExcluding,
  diffDecisions,
  formatMoney,
  formatScore,
  pctDelta,
  personalBest,
  scoreOf,
} from '../lib/metrics'
import { METRIC_LABELS } from '../lib/season'
import { emptyIdea } from '../lib/data'
import { newId } from '../lib/store/store'
import type { Attempt, Metric } from '../lib/types'
import { formatET } from '../lib/time'
import { useTeam } from '../state/app'
import { useCoachPage } from '../state/coach'
import { useActiveRound, useMemberName, useMutations, useRows } from '../state/data'

function ScoreRow({ label, attempt, compare, metric }: { label: string; attempt: Attempt; compare: Attempt | null; metric: Metric }) {
  const v = scoreOf(attempt, metric)
  const c = compare ? scoreOf(compare, metric) : null
  const d = v != null && c != null ? v - c : null
  const pct = v != null && c != null ? pctDelta(v, c) : null
  return (
    <div className="flex items-center justify-between gap-2 py-1.5">
      <span className="text-sm text-slate-500">{label}</span>
      <span className="text-right">
        <Delta value={d} metric={metric} />
        {pct != null && <span className="ml-2 text-xs text-slate-500">({pct >= 0 ? '+' : ''}{pct.toFixed(1)}%)</span>}
      </span>
    </div>
  )
}

export function AttemptDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { canEdit } = useTeam()
  const { rounds } = useActiveRound()
  const { data: attempts = [], isLoading } = useRows('attempts')
  const { data: windows = [] } = useRows('round_windows')
  const { remove, update } = useMutations('attempts')
  const backlog = useMutations('backlog')
  const memberName = useMemberName()
  const [idea, setIdea] = useState('')
  const [error, setError] = useState<unknown>(null)

  const current = attempts.find((x) => x.id === id)
  useCoachPage(
    'Viewing one attempt',
    current
      ? `Attempt "${current.hypothesis}" (status ${current.status}${current.verdict ? `, verdict ${current.verdict}` : ''}), profit ${formatMoney(current.final_profit)}, net worth ${formatMoney(current.final_net_worth)}. Decisions changed: ${current.variables_changed.join(', ') || 'none recorded'}.`
      : '',
  )

  if (isLoading) return <Spinner />
  const a = attempts.find((x) => x.id === id)
  if (!a) return <p>Attempt not found. <Link to="/attempts" className="underline">Back to attempts</Link></p>

  const round = rounds.find((r) => r.id === a.round_id)
  const metric: Metric = round?.ranking_metric ?? 'profit'
  const inRound = attempts.filter((x) => x.round_id === a.round_id)
  const pb = personalBest(inRound, metric)
  const isPb = pb?.id === a.id
  const prevBest = bestBefore(inRound, a, metric)
  const otherBest = bestExcluding(inRound, a, metric)
  const baseline = attempts.find((x) => x.id === a.parent_attempt_id) ?? null
  const compareTo = baseline ?? otherBest
  const diff = compareTo ? diffDecisions(compareTo.decisions, a.decisions) : []
  const win = windows.find((w) => w.id === a.window_id)
  const score = scoreOf(a, metric)
  const baselineCheckpoints = baseline?.checkpoints?.length ? baseline.checkpoints : null

  const addIdea = async () => {
    if (!idea.trim()) return
    try {
      await backlog.insert.mutateAsync({
        id: newId(),
        ...emptyIdea(),
        idea: idea.trim(),
        priority: 0,
        status: 'queued',
        tested_attempt_id: null,
      })
      setIdea('')
    } catch (e) {
      setError(e)
    }
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title={a.hypothesis}
        subtitle={
          <>
            {round?.label}
            {win ? ` · ${win.label}` : ''} · {formatET(a.started_at)} · operator {memberName(a.operator_id)}
            {a.business_type ? ` · ${a.business_type}` : ''}
          </>
        }
        actions={
          canEdit && (
            <>
              <Link className="btn btn-secondary" to={`/attempts/${a.id}/edit`}>
                {a.status === 'in_progress' ? 'Log results' : 'Edit'}
              </Link>
              <Link className="btn btn-primary" to={`/attempts/new?from=${a.id}`}>
                Next run from this
              </Link>
            </>
          )
        }
      />

      <div className="flex flex-wrap items-center gap-2">
        <StatusChip status={a.status} />
        {a.verdict && <StatusChip status={a.verdict} />}
        {isPb && <PbBadge />}
        {a.tags.map((t) => (
          <span key={t} className="chip">
            {t}
          </span>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <div className="section-title">{METRIC_LABELS[metric]} (ranking metric)</div>
          <div className="mt-1 text-3xl font-bold tabular-nums">{formatScore(score, metric)}</div>
          {isPb && prevBest && (
            <p className="mt-1 text-sm font-medium text-emerald-600">
              New personal best — <Delta value={(score ?? 0) - (scoreOf(prevBest, metric) ?? 0)} metric={metric} /> over the
              previous best
            </p>
          )}
          <div className="mt-3 divide-y divide-slate-100 dark:divide-slate-800">
            {!isPb && pb && <ScoreRow label="vs. personal best" attempt={a} compare={pb} metric={metric} />}
            {baseline && <ScoreRow label="vs. baseline run" attempt={a} compare={baseline} metric={metric} />}
          </div>
        </Card>
        <Card>
          <div className="section-title mb-2">All results</div>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm">
            {(
              [
                ['Profit', formatMoney(a.final_profit)],
                ['Net worth', formatMoney(a.final_net_worth)],
                ['Points', a.final_points ?? '—'],
                ['Revenue', formatMoney(a.final_revenue)],
                ['Expenses', formatMoney(a.final_expenses)],
                ['Ending cash', formatMoney(a.ending_cash)],
                ['Lowest cash', formatMoney(a.cash_low_point)],
                ['Loan taken', a.loan_taken == null ? '—' : a.loan_taken ? 'Yes' : 'No'],
                ['Debt remaining', formatMoney(a.total_debt)],
                ['Interest paid', formatMoney(a.interest_paid)],
                ['Satisfaction', a.customer_satisfaction == null ? '—' : `${a.customer_satisfaction}%`],
                ['Employees', a.employees ?? '—'],
                ['Locations', a.locations ?? '—'],
                ['Periods', a.sim_periods_completed ?? '—'],
                ['Minutes', a.minutes_spent ?? '—'],
              ] as [string, string | number][]
            ).map(([k, v]) => (
              <Fragment key={k}>
                <dt className="text-slate-500">{k}</dt>
                <dd className="text-right tabular-nums">{v}</dd>
              </Fragment>
            ))}
          </dl>
        </Card>
      </div>

      <Card>
        <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="section-title">What changed</h2>
          {compareTo && (
            <span className="text-xs text-slate-500">
              compared with {baseline ? 'baseline' : 'best other run'}:{' '}
              <Link className="underline" to={`/attempts/${compareTo.id}`}>
                {compareTo.hypothesis.slice(0, 50)}
              </Link>
            </span>
          )}
        </div>
        {a.decisions.length === 0 && !compareTo ? (
          <p className="text-sm text-slate-500">No decisions recorded.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-slate-500">
                  <th className="py-1 pr-2 font-medium">Decision</th>
                  {compareTo && <th className="py-1 pr-2 font-medium">Before</th>}
                  <th className="py-1 font-medium">This run</th>
                </tr>
              </thead>
              <tbody>
                {(compareTo ? diff : a.decisions.map((d) => ({ key: d.key, before: null, after: d.value, kind: 'same' as const }))).map((r) => (
                  <tr
                    key={r.key}
                    className={
                      r.kind === 'changed'
                        ? 'bg-amber-50 dark:bg-amber-950/40'
                        : r.kind === 'added'
                          ? 'bg-emerald-50 dark:bg-emerald-950/40'
                          : r.kind === 'removed'
                            ? 'bg-rose-50 dark:bg-rose-950/40'
                            : ''
                    }
                  >
                    <td className="py-1.5 pr-2 font-medium">{r.key}</td>
                    {compareTo && <td className="py-1.5 pr-2 text-slate-500">{r.before ?? '—'}</td>}
                    <td className="py-1.5">{r.after ?? <em className="text-slate-400">removed</em>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {(a.checkpoints ?? []).length > 0 && (
        <Card className="overflow-x-auto">
          <h2 className="section-title mb-2">Year by year</h2>
          <table className="w-full text-sm">
            <thead className="text-left text-xs text-slate-500">
              <tr>
                <th className="py-1 font-medium">Period</th>
                <th className="py-1 font-medium">Profit</th>
                {baselineCheckpoints && <th className="py-1 font-medium">vs baseline</th>}
                <th className="py-1 font-medium">Net worth</th>
                <th className="py-1 font-medium">Cash</th>
                <th className="py-1 font-medium">Revenue</th>
                <th className="py-1 font-medium">Note</th>
              </tr>
            </thead>
            <tbody>
              {a.checkpoints.map((c) => {
                const bp = baselineCheckpoints?.find((x) => x.period === c.period)?.profit
                return (
                  <tr key={c.period} className="border-t border-slate-100 dark:border-slate-800">
                    <td className="py-1.5 font-medium">{c.period}</td>
                    <td className="py-1.5 tabular-nums">{formatMoney(c.profit)}</td>
                    {baselineCheckpoints && (
                      <td className="py-1.5">{c.profit != null && bp != null ? <Delta value={c.profit - bp} metric="profit" /> : '—'}</td>
                    )}
                    <td className="py-1.5 tabular-nums">{formatMoney(c.net_worth)}</td>
                    <td className="py-1.5 tabular-nums">{formatMoney(c.cash)}</td>
                    <td className="py-1.5 tabular-nums">{formatMoney(c.revenue)}</td>
                    <td className="py-1.5 text-slate-500">{c.note}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </Card>
      )}

      {(a.run_notes || a.lesson) && (
        <Card className="space-y-3">
          {a.run_notes && (
            <div>
              <h2 className="section-title mb-1">What happened</h2>
              <p className="whitespace-pre-wrap">{a.run_notes}</p>
            </div>
          )}
          {a.lesson && (
            <div>
              <h2 className="section-title mb-1">Lesson learned</h2>
              <p className="whitespace-pre-wrap">{a.lesson}</p>
            </div>
          )}
        </Card>
      )}

      {canEdit && (
        <Card className="space-y-2">
          <h2 className="section-title">Queue the next experiment</h2>
          <div className="flex gap-2">
            <input
              className="input"
              placeholder="What will you test next?"
              aria-label="Next experiment idea"
              value={idea}
              onChange={(e) => setIdea(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  void addIdea()
                }
              }}
            />
            <button type="button" className="btn btn-secondary shrink-0" onClick={() => void addIdea()}>
              Add idea
            </button>
          </div>
        </Card>
      )}

      <ErrorNote error={error} />

      {canEdit && (
        <div className="flex flex-wrap justify-end gap-2 pt-2">
          {a.status !== 'bad_data' && (
            <button
              className="btn btn-ghost"
              onClick={() => update.mutate({ id: a.id, patch: { status: 'bad_data' } })}
              title="Excluded from personal-best calculations"
            >
              Mark as bad data
            </button>
          )}
          <button
            className="btn btn-danger"
            onClick={async () => {
              if (!confirm('Delete this attempt permanently?')) return
              await remove.mutateAsync(a.id)
              navigate('/attempts')
            }}
          >
            Delete
          </button>
        </div>
      )}
    </div>
  )
}
