import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Delta, Empty, PageHeader, PbBadge, Spinner, StatusChip, parseNum } from '../components/ui'
import { diffDecisions, formatMoney, formatScore, personalBest, runStats, scoreOf } from '../lib/metrics'
import { METRIC_LABELS } from '../lib/season'
import type { Attempt } from '../lib/types'
import { formatDate } from '../lib/time'
import { useTeam } from '../state/app'
import { useCoachPage } from '../state/coach'
import { useActiveRound, useMemberName, useRows } from '../state/data'

type SortKey = 'date' | 'score' | 'profit' | 'net_worth' | 'revenue' | 'delta'

const SORTS: { v: SortKey; label: string }[] = [
  { v: 'date', label: 'Date' },
  { v: 'score', label: 'Ranking score' },
  { v: 'delta', label: 'Change vs baseline' },
  { v: 'profit', label: 'Profit' },
  { v: 'net_worth', label: 'Net worth' },
  { v: 'revenue', label: 'Revenue' },
]

export function Attempts() {
  const { canEdit } = useTeam()
  const navigate = useNavigate()
  const { rounds, round } = useActiveRound()
  const { data: attempts = [], isLoading } = useRows('attempts')
  const { data: members = [] } = useRows('members')
  const memberName = useMemberName()
  const [roundFilter, setRoundFilter] = useState<string>('active')
  const [status, setStatus] = useState('')
  const [verdict, setVerdict] = useState('')
  const [tag, setTag] = useState('')
  const [business, setBusiness] = useState('')
  const [operator, setOperator] = useState('')
  const [changed, setChanged] = useState('')
  const [minScore, setMinScore] = useState('')
  const [since, setSince] = useState('')
  const [cleanOnly, setCleanOnly] = useState(false)
  const [q, setQ] = useState('')
  const [sort, setSort] = useState<SortKey>('date')
  const [desc, setDesc] = useState(true)
  const [showFilters, setShowFilters] = useState(false)
  const [selected, setSelected] = useState<string[]>([])

  const effectiveRoundId = roundFilter === 'active' ? round?.id : roundFilter
  const metric = (rounds.find((r) => r.id === effectiveRoundId) ?? round)?.ranking_metric ?? 'profit'
  const byId = useMemo(() => new Map(attempts.map((a) => [a.id, a])), [attempts])
  const allTags = useMemo(() => [...new Set(attempts.flatMap((a) => a.tags))].sort(), [attempts])
  const allBusinesses = useMemo(() => [...new Set(attempts.map((a) => a.business_type).filter(Boolean) as string[])].sort(), [attempts])
  const allChanged = useMemo(() => [...new Set(attempts.flatMap((a) => a.variables_changed))].sort(), [attempts])
  const pbIds = useMemo(() => {
    const ids = new Set<string>()
    for (const r of rounds) {
      const pb = personalBest(
        attempts.filter((a) => a.round_id === r.id),
        r.ranking_metric,
      )
      if (pb) ids.add(pb.id)
    }
    return ids
  }, [attempts, rounds])

  const deltaOf = (a: Attempt): number | null => {
    const base = a.parent_attempt_id ? byId.get(a.parent_attempt_id) : undefined
    const s = scoreOf(a, metric)
    const b = base ? scoreOf(base, metric) : null
    return s != null && b != null ? s - b : null
  }
  const isClean = (a: Attempt) => {
    const base = a.parent_attempt_id ? byId.get(a.parent_attempt_id) : undefined
    return !!base && diffDecisions(base.decisions, a.decisions).filter((r) => r.kind !== 'same').length === 1
  }

  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase()
    const min = parseNum(minScore)
    const filtered = attempts.filter(
      (a) =>
        (roundFilter === 'all' || a.round_id === effectiveRoundId) &&
        (!status || a.status === status) &&
        (!verdict || (verdict === 'none' ? !a.verdict : a.verdict === verdict)) &&
        (!tag || a.tags.includes(tag)) &&
        (!business || a.business_type === business) &&
        (!operator || a.operator_id === operator) &&
        (!changed || a.variables_changed.includes(changed)) &&
        (min == null || (scoreOf(a, metric) ?? -Infinity) >= min) &&
        (!since || a.started_at.slice(0, 10) >= since) &&
        (!cleanOnly || isClean(a)) &&
        (!needle ||
          a.hypothesis.toLowerCase().includes(needle) ||
          (a.lesson ?? '').toLowerCase().includes(needle) ||
          (a.run_notes ?? '').toLowerCase().includes(needle) ||
          a.decisions.some((d) => `${d.key} ${d.value}`.toLowerCase().includes(needle))),
    )
    const val = (a: Attempt): number | string => {
      switch (sort) {
        case 'date':
          return a.started_at
        case 'score':
          return scoreOf(a, metric) ?? -Infinity
        case 'delta':
          return deltaOf(a) ?? -Infinity
        case 'profit':
          return a.final_profit ?? -Infinity
        case 'net_worth':
          return a.final_net_worth ?? -Infinity
        case 'revenue':
          return a.final_revenue ?? -Infinity
      }
    }
    return filtered.sort((x, y) => {
      const a = val(x)
      const b = val(y)
      const c = a < b ? -1 : a > b ? 1 : 0
      return desc ? -c : c
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attempts, roundFilter, effectiveRoundId, status, verdict, tag, business, operator, changed, minScore, since, cleanOnly, q, sort, desc, metric, byId])

  const stats = runStats(rows, metric)
  const activeFilters = [status, verdict, tag, business, operator, changed, minScore, since, cleanOnly ? 'clean' : ''].filter(Boolean).length
  useCoachPage('Attempts list', `${rows.length} runs shown with current filters; best ${formatScore(stats.best, metric)}, median ${formatScore(stats.median, metric)}.`)

  if (isLoading) return <Spinner />

  const toggleSel = (id: string) =>
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s.slice(-1), id]))
  const header = (key: SortKey, label: string, cls = '') => (
    <th className={`py-2 pr-3 font-medium ${cls}`}>
      <button
        className="inline-flex items-center gap-1 hover:text-slate-900 dark:hover:text-white"
        onClick={() => (sort === key ? setDesc(!desc) : (setSort(key), setDesc(true)))}
      >
        {label}
        {sort === key && <span aria-hidden>{desc ? '↓' : '↑'}</span>}
      </button>
    </th>
  )
  const clearFilters = () => {
    setStatus('')
    setVerdict('')
    setTag('')
    setBusiness('')
    setOperator('')
    setChanged('')
    setMinScore('')
    setSince('')
    setCleanOnly(false)
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="Attempts"
        subtitle={`Ranking by ${METRIC_LABELS[metric].toLowerCase()}. Tick two runs to compare them.`}
        actions={
          <>
            {selected.length === 2 && (
              <button className="btn btn-secondary" onClick={() => navigate(`/attempts/compare?a=${selected[0]}&b=${selected[1]}`)}>
                Compare 2 runs
              </button>
            )}
            {canEdit && (
              <Link to="/attempts/new" className="btn btn-primary">
                + Log attempt
              </Link>
            )}
          </>
        }
      />

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
        {[
          ['Runs shown', String(stats.count)],
          ['Best', formatScore(stats.best, metric)],
          ['Average', formatScore(stats.mean, metric)],
          ['Median', formatScore(stats.median, metric)],
          ['Time', `${(stats.minutes / 60).toFixed(1)} h`],
        ].map(([k, v]) => (
          <div key={k} className="card px-3 py-2">
            <div className="text-xs text-slate-500">{k}</div>
            <div className="font-semibold tabular-nums">{v}</div>
          </div>
        ))}
      </div>

      <div className="card space-y-3 p-3">
        <div className="flex flex-wrap gap-2">
          <input className="input min-w-40 flex-1" placeholder="Search hypotheses, notes, decisions…" aria-label="Search attempts" value={q} onChange={(e) => setQ(e.target.value)} />
          <select className="input w-auto" aria-label="Round filter" value={roundFilter} onChange={(e) => setRoundFilter(e.target.value)}>
            <option value="active">Active round</option>
            <option value="all">All rounds</option>
            {rounds.map((r) => (
              <option key={r.id} value={r.id}>
                {r.label}
              </option>
            ))}
          </select>
          <select className="input w-auto" aria-label="Sort by" value={sort} onChange={(e) => setSort(e.target.value as SortKey)}>
            {SORTS.map((s) => (
              <option key={s.v} value={s.v}>
                Sort: {s.label}
              </option>
            ))}
          </select>
          <button className="btn btn-secondary" onClick={() => setDesc(!desc)} aria-label="Toggle sort direction">
            {desc ? '↓ High first' : '↑ Low first'}
          </button>
          <button className="btn btn-secondary" onClick={() => setShowFilters(!showFilters)} aria-expanded={showFilters}>
            Filters{activeFilters ? ` (${activeFilters})` : ''} {showFilters ? '▴' : '▾'}
          </button>
        </div>
        {showFilters && (
          <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
            <select className="input" aria-label="Status filter" value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="">Any status</option>
              <option value="completed">Completed</option>
              <option value="in_progress">Planned</option>
              <option value="aborted">Aborted</option>
              <option value="bad_data">Bad data</option>
            </select>
            <select className="input" aria-label="Verdict filter" value={verdict} onChange={(e) => setVerdict(e.target.value)}>
              <option value="">Any verdict</option>
              <option value="keep">Keep</option>
              <option value="discard">Discard</option>
              <option value="inconclusive">Inconclusive</option>
              <option value="none">No verdict yet</option>
            </select>
            <select className="input" aria-label="Decision changed filter" value={changed} onChange={(e) => setChanged(e.target.value)}>
              <option value="">Any decision changed</option>
              {allChanged.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
            <select className="input" aria-label="Tag filter" value={tag} onChange={(e) => setTag(e.target.value)}>
              <option value="">Any tag</option>
              {allTags.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
            <select className="input" aria-label="Business filter" value={business} onChange={(e) => setBusiness(e.target.value)}>
              <option value="">Any business</option>
              {allBusinesses.map((b) => (
                <option key={b}>{b}</option>
              ))}
            </select>
            <select className="input" aria-label="Operator filter" value={operator} onChange={(e) => setOperator(e.target.value)}>
              <option value="">Any operator</option>
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.display_name}
                </option>
              ))}
            </select>
            <input className="input" inputMode="decimal" placeholder="Min score" aria-label="Minimum score" value={minScore} onChange={(e) => setMinScore(e.target.value)} />
            <input className="input" type="date" aria-label="Logged on or after" value={since} onChange={(e) => setSince(e.target.value)} />
            <label className="col-span-2 flex items-center gap-2 text-sm">
              <input type="checkbox" checked={cleanOnly} onChange={(e) => setCleanOnly(e.target.checked)} />
              Clean tests only (exactly one decision changed vs. baseline)
            </label>
            {activeFilters > 0 && (
              <button className="btn btn-ghost col-span-2 justify-self-end" onClick={clearFilters}>
                Clear filters
              </button>
            )}
          </div>
        )}
      </div>

      {rows.length === 0 ? (
        <Empty title="No attempts match">
          {attempts.length === 0 ? 'Log your first run — even a bad one is data.' : 'Try clearing the filters.'}
        </Empty>
      ) : (
        <>
          {/* Mobile cards */}
          <ul className="space-y-2 md:hidden">
            {rows.map((a) => (
              <li key={a.id} className="card flex gap-3">
                <input type="checkbox" className="mt-1" aria-label="Select for compare" checked={selected.includes(a.id)} onChange={() => toggleSel(a.id)} />
                <Link to={`/attempts/${a.id}`} className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-medium">{a.hypothesis}</span>
                    <span className="shrink-0 text-right">
                      <span className="block font-semibold tabular-nums">{formatScore(scoreOf(a, metric), metric)}</span>
                      <span className="text-xs">
                        <Delta value={deltaOf(a)} metric={metric} />
                      </span>
                    </span>
                  </div>
                  <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-xs text-slate-500">
                    <span>{formatDate(a.started_at)}</span>
                    <StatusChip status={a.status} />
                    {a.verdict && <StatusChip status={a.verdict} />}
                    {pbIds.has(a.id) && <PbBadge />}
                    {a.variables_changed.length > 0 && <span>Δ {a.variables_changed.join(', ')}</span>}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
          {/* Desktop table */}
          <div className="card hidden overflow-x-auto p-0 md:block">
            <table className="w-full text-sm">
              <thead className="border-b border-slate-200 text-left text-xs text-slate-500 dark:border-slate-800">
                <tr>
                  <th className="w-2" />
                  <th className="w-8 py-2 pl-2">
                    <span className="sr-only">Select</span>
                  </th>
                  {header('date', 'Date')}
                  <th className="py-2 pr-3 font-medium">Hypothesis</th>
                  <th className="py-2 pr-3 font-medium">Changed</th>
                  {header('score', METRIC_LABELS[metric])}
                  {header('delta', 'vs base')}
                  {metric !== 'profit' && header('profit', 'Profit')}
                  {metric !== 'net_worth' && header('net_worth', 'Net worth')}
                  {header('revenue', 'Revenue')}
                  <th className="py-2 pr-3 font-medium">Low cash</th>
                  <th className="py-2 pr-3 font-medium">Status</th>
                  <th className="py-2 pr-3 font-medium">Operator</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {rows.map((a) => (
                  <tr key={a.id} className="cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50" onClick={() => navigate(`/attempts/${a.id}`)}>
                    <td className={pbIds.has(a.id) ? 'bg-amber-400' : ''} />
                    <td className="py-2 pl-2" onClick={(e) => e.stopPropagation()}>
                      <input type="checkbox" aria-label="Select for compare" checked={selected.includes(a.id)} onChange={() => toggleSel(a.id)} />
                    </td>
                    <td className="py-2 pr-3 whitespace-nowrap">{formatDate(a.started_at)}</td>
                    <td className="max-w-xs py-2 pr-3">
                      <Link to={`/attempts/${a.id}`} className="line-clamp-2 font-medium" onClick={(e) => e.stopPropagation()}>
                        {a.hypothesis}
                      </Link>
                      {a.tags.length > 0 && <div className="mt-0.5 text-xs text-slate-500">{a.tags.join(' · ')}</div>}
                    </td>
                    <td className="py-2 pr-3 text-xs text-slate-500">{a.variables_changed.join(', ') || '—'}</td>
                    <td className="py-2 pr-3 font-semibold whitespace-nowrap tabular-nums">
                      {formatScore(scoreOf(a, metric), metric)} {pbIds.has(a.id) && <PbBadge />}
                    </td>
                    <td className="py-2 pr-3 whitespace-nowrap">
                      <Delta value={deltaOf(a)} metric={metric} />
                    </td>
                    {metric !== 'profit' && <td className="py-2 pr-3 tabular-nums">{formatMoney(a.final_profit)}</td>}
                    {metric !== 'net_worth' && <td className="py-2 pr-3 tabular-nums">{formatMoney(a.final_net_worth)}</td>}
                    <td className="py-2 pr-3 tabular-nums">{formatMoney(a.final_revenue)}</td>
                    <td className="py-2 pr-3 tabular-nums">{formatMoney(a.cash_low_point)}</td>
                    <td className="py-2 pr-3">
                      <div className="flex gap-1">
                        <StatusChip status={a.status} />
                        {a.verdict && <StatusChip status={a.verdict} />}
                      </div>
                    </td>
                    <td className="py-2 pr-3">{memberName(a.operator_id)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}
