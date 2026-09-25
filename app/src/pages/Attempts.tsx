import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Empty, PageHeader, PbBadge, Spinner, StatusChip } from '../components/ui'
import { formatMoney, formatScore, personalBest, scoreOf } from '../lib/metrics'
import { METRIC_LABELS } from '../lib/season'
import type { Attempt } from '../lib/types'
import { formatDate } from '../lib/time'
import { useTeam } from '../state/app'
import { useActiveRound, useMemberName, useRows } from '../state/data'

type SortKey = 'date' | 'score' | 'profit' | 'net_worth'

export function Attempts() {
  const { canEdit } = useTeam()
  const navigate = useNavigate()
  const { rounds, round } = useActiveRound()
  const { data: attempts = [], isLoading } = useRows('attempts')
  const memberName = useMemberName()
  const [roundFilter, setRoundFilter] = useState<string>('active')
  const [status, setStatus] = useState<string>('')
  const [verdict, setVerdict] = useState<string>('')
  const [tag, setTag] = useState<string>('')
  const [q, setQ] = useState('')
  const [sort, setSort] = useState<SortKey>('date')
  const [desc, setDesc] = useState(true)

  const effectiveRoundId = roundFilter === 'active' ? round?.id : roundFilter
  const metric = (rounds.find((r) => r.id === effectiveRoundId) ?? round)?.ranking_metric ?? 'profit'
  const allTags = useMemo(() => [...new Set(attempts.flatMap((a) => a.tags))].sort(), [attempts])
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

  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase()
    const filtered = attempts.filter(
      (a) =>
        (roundFilter === 'all' || a.round_id === effectiveRoundId) &&
        (!status || a.status === status) &&
        (!verdict || a.verdict === verdict) &&
        (!tag || a.tags.includes(tag)) &&
        (!needle ||
          a.hypothesis.toLowerCase().includes(needle) ||
          (a.lesson ?? '').toLowerCase().includes(needle) ||
          a.variables_changed.some((v) => v.toLowerCase().includes(needle))),
    )
    const val = (a: Attempt): number | string => {
      switch (sort) {
        case 'date':
          return a.started_at
        case 'score':
          return scoreOf(a, metric) ?? -Infinity
        case 'profit':
          return a.final_profit ?? -Infinity
        case 'net_worth':
          return a.final_net_worth ?? -Infinity
      }
    }
    return filtered.sort((x, y) => {
      const a = val(x)
      const b = val(y)
      const c = a < b ? -1 : a > b ? 1 : 0
      return desc ? -c : c
    })
  }, [attempts, roundFilter, effectiveRoundId, status, verdict, tag, q, sort, desc, metric])

  if (isLoading) return <Spinner />

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

  return (
    <div className="space-y-4">
      <PageHeader
        title="Attempts"
        subtitle={`${rows.length} shown · ranking by ${METRIC_LABELS[metric].toLowerCase()}`}
        actions={
          canEdit && (
            <Link to="/attempts/new" className="btn btn-primary">
              + Log attempt
            </Link>
          )
        }
      />

      <div className="grid grid-cols-2 gap-2 md:grid-cols-5">
        <input className="input col-span-2 md:col-span-1" placeholder="Search…" aria-label="Search attempts" value={q} onChange={(e) => setQ(e.target.value)} />
        <select className="input" aria-label="Round filter" value={roundFilter} onChange={(e) => setRoundFilter(e.target.value)}>
          <option value="active">Active round</option>
          <option value="all">All rounds</option>
          {rounds.map((r) => (
            <option key={r.id} value={r.id}>
              {r.label}
            </option>
          ))}
        </select>
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
        </select>
        <select className="input" aria-label="Tag filter" value={tag} onChange={(e) => setTag(e.target.value)}>
          <option value="">Any tag</option>
          {allTags.map((t) => (
            <option key={t}>{t}</option>
          ))}
        </select>
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
              <li key={a.id}>
                <Link to={`/attempts/${a.id}`} className="card block">
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-medium">{a.hypothesis}</span>
                    <span className="shrink-0 font-semibold tabular-nums">{formatScore(scoreOf(a, metric), metric)}</span>
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
                  {header('date', 'Date', 'pl-2')}
                  <th className="py-2 pr-3 font-medium">Hypothesis</th>
                  <th className="py-2 pr-3 font-medium">Changed</th>
                  {header('score', METRIC_LABELS[metric])}
                  {metric !== 'profit' && header('profit', 'Profit')}
                  {metric !== 'net_worth' && header('net_worth', 'Net worth')}
                  <th className="py-2 pr-3 font-medium">Status</th>
                  <th className="py-2 pr-3 font-medium">Operator</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {rows.map((a) => (
                  <tr
                    key={a.id}
                    className="cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50"
                    onClick={() => navigate(`/attempts/${a.id}`)}
                  >
                    <td className={pbIds.has(a.id) ? 'bg-amber-400' : ''} />
                    <td className="py-2 pr-3 pl-2 whitespace-nowrap">{formatDate(a.started_at)}</td>
                    <td className="max-w-xs py-2 pr-3">
                      <Link to={`/attempts/${a.id}`} className="line-clamp-2 font-medium" onClick={(e) => e.stopPropagation()}>
                        {a.hypothesis}
                      </Link>
                      {a.tags.length > 0 && <div className="mt-0.5 text-xs text-slate-500">{a.tags.join(' · ')}</div>}
                    </td>
                    <td className="py-2 pr-3 text-xs text-slate-500">{a.variables_changed.join(', ') || '—'}</td>
                    <td className="py-2 pr-3 font-semibold tabular-nums">
                      {formatScore(scoreOf(a, metric), metric)} {pbIds.has(a.id) && <PbBadge />}
                    </td>
                    {metric !== 'profit' && <td className="py-2 pr-3 tabular-nums">{formatMoney(a.final_profit)}</td>}
                    {metric !== 'net_worth' && <td className="py-2 pr-3 tabular-nums">{formatMoney(a.final_net_worth)}</td>}
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
