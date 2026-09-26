import { Link } from 'react-router-dom'
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Card, Delta, Empty, PageHeader, Spinner, Stat, StatusChip } from '../components/ui'
import { METRIC_LABELS } from '../lib/season'
import { formatScore, nextEvent, personalBest, progressSeries, roundPhase, scoreOf, variableEffects } from '../lib/metrics'
import { formatDuration, formatET, formatLocal, isSameLocalDay } from '../lib/time'
import { useTeam } from '../state/app'
import { useCoachPage } from '../state/coach'
import { useActiveRound, useNow, useRows } from '../state/data'

export function Home() {
  const { canEdit } = useTeam()
  const { rounds, round, isLoading } = useActiveRound()
  const { data: attempts = [] } = useRows('attempts')
  const { data: backlog = [] } = useRows('backlog')
  const { data: timeLogs = [] } = useRows('time_logs')
  const { data: snapshots = [] } = useRows('leaderboard_snapshots')
  const now = useNow(1000 * 30)

  useCoachPage('Home dashboard')

  if (isLoading) return <Spinner />
  if (!round) return <Empty title="No rounds yet">Add one in Team settings.</Empty>

  const metric = round.ranking_metric
  const inRound = attempts.filter((a) => a.round_id === round.id)
  const pb = personalBest(inRound, metric)
  const pbScore = pb ? scoreOf(pb, metric) : null
  const today = inRound.filter((a) => isSameLocalDay(a.started_at, now))
  const planned = inRound.filter((a) => a.status === 'in_progress')
  const minutes =
    inRound.reduce((s, a) => s + (a.minutes_spent ?? 0), 0) +
    timeLogs.filter((t) => t.round_id === round.id).reduce((s, t) => s + t.minutes, 0)
  const latestSnap = snapshots
    .filter((s) => s.round_id === round.id)
    .sort((a, b) => b.captured_at.localeCompare(a.captured_at))[0]
  const cutoff = latestSnap?.cutoff_rank2_score ?? round.est_qualifying_cutoff
  const series = progressSeries(inRound, metric)
  const effects = variableEffects(inRound, metric)
  const next = nextEvent(rounds, now)
  const phase = roundPhase(round, now)
  const queued = backlog
    .filter((b) => b.status === 'queued')
    .sort((a, b) => b.priority - a.priority || a.created_at.localeCompare(b.created_at))
    .slice(0, 3)

  return (
    <div className="space-y-4">
      <PageHeader
        title={round.label}
        subtitle={
          round.opens_at ? (
            <>
              {phase === 'open' ? 'Open now' : phase === 'upcoming' ? 'Upcoming' : 'Closed'} · {formatET(round.opens_at)} →{' '}
              {formatET(round.closes_at)}
            </>
          ) : (
            'Practice — no deadline'
          )
        }
        actions={
          canEdit && (
            <Link to="/attempts/new" className="btn btn-primary">
              + Log attempt
            </Link>
          )
        }
      />

      {next && (
        <Card className="flex flex-wrap items-center justify-between gap-2 bg-brand-50 dark:bg-slate-900">
          <div>
            <div className="section-title">Next deadline</div>
            <div className="text-lg font-semibold">
              {next.round.label} {next.kind} in {formatDuration(Date.parse(next.at) - now.getTime())}
            </div>
          </div>
          <div className="text-right text-sm text-slate-600 dark:text-slate-400">
            <div>{formatET(next.at)}</div>
            <div className="text-xs">your time: {formatLocal(next.at)}</div>
          </div>
        </Card>
      )}

      {!round.metric_verified && round.kind !== 'practice' && (
        <p className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200">
          Ranking metric set to <strong>{METRIC_LABELS[metric]}</strong> but not verified. Sources disagree (profit vs.
          net worth vs. points) — check the 2026-27 VBC Guidelines and confirm it in{' '}
          <Link className="underline" to="/settings">
            Team settings
          </Link>
          . Every attempt stores all three, so nothing is lost.
        </p>
      )}

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat
          label={`Best ${METRIC_LABELS[metric].toLowerCase()}`}
          value={formatScore(pbScore, metric)}
          sub={pb ? <Link to={`/attempts/${pb.id}`}>view PB run →</Link> : 'No completed runs yet'}
        />
        <Stat
          label="Gap to cutoff"
          value={cutoff != null && pbScore != null ? <Delta value={pbScore - cutoff} metric={metric} /> : '—'}
          sub={cutoff != null ? `cutoff ≈ ${formatScore(cutoff, metric)}` : 'Set in Round page'}
        />
        <Stat label="Attempts today" value={today.length} sub={`${inRound.length} this round`} />
        <Stat label="Hours logged" value={(minutes / 60).toFixed(1)} sub="attempts + other prep" />
      </div>

      {planned.length > 0 && (
        <Card>
          <h2 className="section-title mb-2">Planned — finish logging</h2>
          <ul className="divide-y divide-slate-100 dark:divide-slate-800">
            {planned.map((a) => (
              <li key={a.id} className="flex items-center justify-between gap-2 py-2">
                <span className="truncate">{a.hypothesis}</span>
                <Link className="btn btn-secondary shrink-0" to={`/attempts/${a.id}/edit`}>
                  Log results
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <Card>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="section-title">Progress · {METRIC_LABELS[metric]}</h2>
          <span className="text-xs text-slate-500">{series.length} scored runs</span>
        </div>
        {series.length < 2 ? (
          <p className="py-6 text-center text-sm text-slate-500">The chart appears after two completed runs.</p>
        ) : (
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={series} margin={{ left: 8, right: 8, top: 8, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="currentColor" strokeOpacity={0.1} />
                <XAxis dataKey="n" tick={{ fontSize: 12 }} />
                <YAxis
                  tick={{ fontSize: 12 }}
                  width={70}
                  tickFormatter={(v: number) => (metric === 'points' ? String(v) : `$${Math.round(v / 1000)}k`)}
                />
                <Tooltip
                  formatter={(v, name) => [formatScore(Number(v), metric), name === 'best' ? 'Best so far' : 'This run']}
                  labelFormatter={(n) => `Run #${n}`}
                />
                <Line type="stepAfter" dataKey="best" stroke="#f59e0b" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="score" stroke="#2563eb" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </Card>

      <Card>
        <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="section-title">What’s working (from your clean tests)</h2>
          <span className="text-xs text-slate-500">change in {METRIC_LABELS[metric].toLowerCase()} vs. baseline, single-change runs only</span>
        </div>
        {effects.length === 0 ? (
          <p className="text-sm text-slate-500">
            Appears once you log a run with a baseline and change one decision. The AI coach uses this table too.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs text-slate-500">
                <tr>
                  <th className="py-1 font-medium">Decision</th>
                  <th className="py-1 font-medium">Clean tests</th>
                  <th className="py-1 font-medium">Avg effect</th>
                  <th className="py-1 font-medium">Best</th>
                  <th className="py-1 font-medium">Latest change</th>
                </tr>
              </thead>
              <tbody>
                {effects.slice(0, 8).map((e) => (
                  <tr key={e.key} className="border-t border-slate-100 dark:border-slate-800">
                    <td className="py-1.5 font-medium">{e.key}</td>
                    <td className="py-1.5">
                      {e.cleanRuns}
                      {e.mixedRuns > 0 && <span className="text-xs text-slate-500"> (+{e.mixedRuns} mixed)</span>}
                    </td>
                    <td className="py-1.5">
                      <Delta value={e.avgDelta} metric={metric} />
                    </td>
                    <td className="py-1.5">
                      <Delta value={e.bestDelta} metric={metric} />
                    </td>
                    <td className="py-1.5 text-xs text-slate-500">
                      {e.examples[0] ? `${e.examples[0].before ?? '(blank)'} → ${e.examples[0].after ?? '(removed)'}` : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {effects.every((e) => e.cleanRuns < 2) && (
              <p className="hint">One run per change is weak evidence — repeat promising changes before trusting them.</p>
            )}
          </div>
        )}
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <div className="mb-2 flex items-center justify-between">
            <h2 className="section-title">Next experiments</h2>
            <Link to="/backlog" className="text-sm text-brand-600">
              All ideas →
            </Link>
          </div>
          {queued.length === 0 ? (
            <p className="text-sm text-slate-500">No queued ideas. Add one after every run.</p>
          ) : (
            <ul className="space-y-2">
              {queued.map((b) => (
                <li key={b.id} className="flex items-center justify-between gap-2">
                  <span className="min-w-0 truncate">{b.idea}</span>
                  {canEdit && (
                    <Link className="btn btn-secondary shrink-0" to={`/attempts/new?backlog=${b.id}`}>
                      Test
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          )}
        </Card>
        <Card>
          <div className="mb-2 flex items-center justify-between">
            <h2 className="section-title">Recent attempts</h2>
            <Link to="/attempts" className="text-sm text-brand-600">
              All →
            </Link>
          </div>
          {inRound.length === 0 ? (
            <p className="text-sm text-slate-500">Nothing logged in this round yet.</p>
          ) : (
            <ul className="space-y-2">
              {[...inRound]
                .sort((a, b) => b.started_at.localeCompare(a.started_at))
                .slice(0, 5)
                .map((a) => (
                  <li key={a.id}>
                    <Link to={`/attempts/${a.id}`} className="flex items-center justify-between gap-2">
                      <span className="min-w-0 truncate">{a.hypothesis}</span>
                      <span className="flex shrink-0 items-center gap-2 text-sm tabular-nums">
                        {a.status === 'completed' ? formatScore(scoreOf(a, metric), metric) : <StatusChip status={a.status} />}
                      </span>
                    </Link>
                  </li>
                ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  )
}
