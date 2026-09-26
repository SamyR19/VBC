import { Link, useSearchParams } from 'react-router-dom'
import { Card, Delta, PageHeader, Spinner } from '../components/ui'
import { diffDecisions, formatMoney, formatScore, scoreOf } from '../lib/metrics'
import { METRIC_LABELS } from '../lib/season'
import type { Attempt, Metric } from '../lib/types'
import { formatDate } from '../lib/time'
import { useCoachPage } from '../state/coach'
import { useActiveRound, useRows } from '../state/data'

const RESULT_ROWS: { label: string; get: (a: Attempt) => number | null; money?: boolean }[] = [
  { label: 'Final profit', get: (a) => a.final_profit, money: true },
  { label: 'Final net worth', get: (a) => a.final_net_worth, money: true },
  { label: 'Points', get: (a) => a.final_points },
  { label: 'Total revenue', get: (a) => a.final_revenue, money: true },
  { label: 'Total expenses', get: (a) => a.final_expenses, money: true },
  { label: 'Ending cash', get: (a) => a.ending_cash, money: true },
  { label: 'Lowest cash', get: (a) => a.cash_low_point, money: true },
  { label: 'Debt remaining', get: (a) => a.total_debt, money: true },
  { label: 'Interest paid', get: (a) => a.interest_paid, money: true },
  { label: 'Customer satisfaction %', get: (a) => a.customer_satisfaction },
  { label: 'Employees', get: (a) => a.employees },
  { label: 'Locations', get: (a) => a.locations },
  { label: 'Minutes', get: (a) => a.minutes_spent },
]

export function Compare() {
  const [params] = useSearchParams()
  const { rounds } = useActiveRound()
  const { data: attempts = [], isLoading } = useRows('attempts')
  const a = attempts.find((x) => x.id === params.get('a'))
  const b = attempts.find((x) => x.id === params.get('b'))
  useCoachPage(
    'Comparing two runs',
    a && b ? `Run A: "${a.hypothesis}". Run B: "${b.hypothesis}". Decision differences: ${diffDecisions(a.decisions, b.decisions).filter((r) => r.kind !== 'same').map((r) => `${r.key}: ${r.before ?? '-'} vs ${r.after ?? '-'}`).join('; ') || 'none'}` : '',
  )
  if (isLoading) return <Spinner />
  if (!a || !b) return <p>Pick two attempts on the Attempts page first.</p>
  const metric: Metric = rounds.find((r) => r.id === a.round_id)?.ranking_metric ?? 'profit'
  const diff = diffDecisions(a.decisions, b.decisions)
  const periods = [...new Set([...(a.checkpoints ?? []), ...(b.checkpoints ?? [])].map((c) => c.period))]

  return (
    <div className="space-y-4">
      <PageHeader title="Compare runs" subtitle="Column B minus column A. Green = B did better." />
      <div className="grid gap-3 sm:grid-cols-2">
        {[a, b].map((x, i) => (
          <Card key={x.id}>
            <div className="section-title">Run {i ? 'B' : 'A'} · {formatDate(x.started_at)}</div>
            <Link to={`/attempts/${x.id}`} className="font-medium underline">
              {x.hypothesis}
            </Link>
            <div className="mt-1 text-2xl font-bold tabular-nums">{formatScore(scoreOf(x, metric), metric)}</div>
            <div className="text-xs text-slate-500">{METRIC_LABELS[metric]}</div>
          </Card>
        ))}
      </div>

      <Card className="overflow-x-auto">
        <h2 className="section-title mb-2">Results</h2>
        <table className="w-full text-sm">
          <thead className="text-left text-xs text-slate-500">
            <tr>
              <th className="py-1 font-medium">Metric</th>
              <th className="py-1 font-medium">A</th>
              <th className="py-1 font-medium">B</th>
              <th className="py-1 font-medium">B − A</th>
            </tr>
          </thead>
          <tbody>
            {RESULT_ROWS.filter((r) => r.get(a) != null || r.get(b) != null).map((r) => {
              const va = r.get(a)
              const vb = r.get(b)
              const fmt = (n: number | null) => (r.money ? formatMoney(n) : n == null ? '—' : n.toLocaleString())
              return (
                <tr key={r.label} className="border-t border-slate-100 dark:border-slate-800">
                  <td className="py-1.5">{r.label}</td>
                  <td className="py-1.5 tabular-nums">{fmt(va)}</td>
                  <td className="py-1.5 tabular-nums">{fmt(vb)}</td>
                  <td className="py-1.5">{va != null && vb != null ? r.money ? <Delta value={vb - va} metric="profit" /> : <Delta value={vb - va} metric="points" /> : '—'}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </Card>

      {periods.length > 0 && (
        <Card className="overflow-x-auto">
          <h2 className="section-title mb-2">Profit by period</h2>
          <table className="w-full text-sm">
            <thead className="text-left text-xs text-slate-500">
              <tr>
                <th className="py-1 font-medium">Period</th>
                <th className="py-1 font-medium">A</th>
                <th className="py-1 font-medium">B</th>
                <th className="py-1 font-medium">B − A</th>
              </tr>
            </thead>
            <tbody>
              {periods.map((p) => {
                const ca = a.checkpoints?.find((c) => c.period === p)?.profit ?? null
                const cb = b.checkpoints?.find((c) => c.period === p)?.profit ?? null
                return (
                  <tr key={p} className="border-t border-slate-100 dark:border-slate-800">
                    <td className="py-1.5">{p}</td>
                    <td className="py-1.5 tabular-nums">{formatMoney(ca)}</td>
                    <td className="py-1.5 tabular-nums">{formatMoney(cb)}</td>
                    <td className="py-1.5">{ca != null && cb != null ? <Delta value={cb - ca} metric="profit" /> : '—'}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </Card>
      )}

      <Card className="overflow-x-auto">
        <h2 className="section-title mb-2">Decisions</h2>
        <table className="w-full text-sm">
          <thead className="text-left text-xs text-slate-500">
            <tr>
              <th className="py-1 font-medium">Decision</th>
              <th className="py-1 font-medium">A</th>
              <th className="py-1 font-medium">B</th>
            </tr>
          </thead>
          <tbody>
            {diff.map((r) => (
              <tr key={r.key} className={`border-t border-slate-100 dark:border-slate-800 ${r.kind !== 'same' ? 'bg-amber-50 dark:bg-amber-950/40' : ''}`}>
                <td className="py-1.5 font-medium">{r.key}</td>
                <td className="py-1.5">{r.before ?? '—'}</td>
                <td className="py-1.5">{r.after ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  )
}
