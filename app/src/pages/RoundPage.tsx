import { useState, type FormEvent } from 'react'
import { Card, ErrorNote, Field, PageHeader, Spinner, parseNum } from '../components/ui'
import { seedChecklist } from '../lib/data'
import { formatScore, personalBest, roundPhase, scoreOf } from '../lib/metrics'
import { newId, nowIso } from '../lib/store/store'
import type { ChecklistItem } from '../lib/types'
import { formatDuration, formatET, formatLocal, todayISODate } from '../lib/time'
import { useTeam } from '../state/app'
import { useActiveRound, useInvalidateAll, useMemberName, useMutations, useNow, useRows } from '../state/data'

function ChecklistRow({
  item,
  canEdit,
  onToggle,
  onRemove,
}: {
  item: ChecklistItem
  canEdit: boolean
  onToggle: (done: boolean) => void
  onRemove: () => void
}) {
  // Local mirror so the tick is instant even while the save is in flight.
  const [done, setDone] = useState(item.done)
  const [synced, setSynced] = useState(item.done)
  if (item.done !== synced) {
    setSynced(item.done)
    setDone(item.done)
  }
  return (
    <li className="group flex items-start gap-2">
      <input
        type="checkbox"
        className="mt-1 h-4 w-4"
        id={`chk-${item.id}`}
        checked={done}
        disabled={!canEdit}
        onChange={(e) => {
          setDone(e.target.checked)
          onToggle(e.target.checked)
        }}
      />
      <label htmlFor={`chk-${item.id}`} className={`flex-1 text-sm ${done ? 'text-slate-400 line-through' : ''}`}>
        {item.text}
      </label>
      {canEdit && (
        <button
          className="text-xs text-slate-400 hover:text-rose-600 focus:opacity-100 md:opacity-0 md:group-hover:opacity-100"
          aria-label={`Remove "${item.text}"`}
          onClick={onRemove}
        >
          ✕
        </button>
      )}
    </li>
  )
}

function Checklist({ roundId }: { roundId: string }) {
  const { store, team, canEdit } = useTeam()
  const { data: items = [] } = useRows('checklist_items')
  const { insert, update, remove } = useMutations('checklist_items')
  const invalidate = useInvalidateAll()
  const [text, setText] = useState('')
  const list = items.filter((i) => i.round_id === roundId).sort((a, b) => a.position - b.position)
  const done = list.filter((i) => i.done).length

  return (
    <Card className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="section-title">Round-day checklist</h2>
        {list.length > 0 && (
          <span className="text-sm text-slate-500">
            {done}/{list.length} done
          </span>
        )}
      </div>
      {list.length === 0 ? (
        canEdit ? (
          <button
            className="btn btn-secondary"
            onClick={async () => {
              await seedChecklist(store, team.id, roundId)
              await invalidate()
            }}
          >
            Load default checklist
          </button>
        ) : (
          <p className="text-sm text-slate-500">No checklist yet.</p>
        )
      ) : (
        <ul className="space-y-1">
          {list.map((i) => (
            <ChecklistRow
              key={i.id}
              item={i}
              canEdit={canEdit}
              onToggle={(done) => update.mutate({ id: i.id, patch: { done } })}
              onRemove={() => remove.mutate(i.id)}
            />
          ))}
        </ul>
      )}
      {canEdit && list.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <form
            className="flex flex-1 gap-2"
            onSubmit={(e) => {
              e.preventDefault()
              if (!text.trim()) return
              insert.mutate({ id: newId(), round_id: roundId, text: text.trim(), done: false, position: list.length })
              setText('')
            }}
          >
            <input className="input" placeholder="Add item" aria-label="New checklist item" value={text} onChange={(e) => setText(e.target.value)} />
            <button className="btn btn-secondary">Add</button>
          </form>
          <button
            className="btn btn-ghost"
            onClick={() => list.filter((i) => i.done).forEach((i) => update.mutate({ id: i.id, patch: { done: false } }))}
          >
            Reset for next session
          </button>
        </div>
      )}
    </Card>
  )
}

function Leaderboard({ roundId }: { roundId: string }) {
  const { canEdit } = useTeam()
  const { rounds } = useActiveRound()
  const { data: snaps = [] } = useRows('leaderboard_snapshots')
  const { data: attempts = [] } = useRows('attempts')
  const { insert, remove } = useMutations('leaderboard_snapshots')
  const round = rounds.find((r) => r.id === roundId)!
  const metric = round.ranking_metric
  const pb = personalBest(
    attempts.filter((a) => a.round_id === roundId),
    metric,
  )
  const [rank, setRank] = useState('')
  const [best, setBest] = useState('')
  const [cutoff, setCutoff] = useState('')
  const [note, setNote] = useState('')
  const [error, setError] = useState<unknown>(null)
  const list = snaps.filter((s) => s.round_id === roundId).sort((a, b) => b.captured_at.localeCompare(a.captured_at))

  const add = async (e: FormEvent) => {
    e.preventDefault()
    try {
      await insert.mutateAsync({
        id: newId(),
        round_id: roundId,
        captured_at: nowIso(),
        our_rank_region: parseNum(rank),
        our_best: parseNum(best) ?? (pb ? scoreOf(pb, metric) : null),
        cutoff_rank2_score: parseNum(cutoff),
        note: note.trim() || null,
      })
      setRank('')
      setBest('')
      setCutoff('')
      setNote('')
    } catch (err) {
      setError(err)
    }
  }

  return (
    <Card className="space-y-3">
      <h2 className="section-title">Leaderboard snapshots</h2>
      <p className="text-sm text-slate-500">
        Copy your regional rank and the 2nd-place score from the public leaderboard after each session. The latest cutoff
        powers "gap to cutoff" on Home.
      </p>
      {canEdit && (
        <form onSubmit={add} className="grid grid-cols-2 gap-2 sm:grid-cols-5">
          <input className="input" inputMode="numeric" placeholder="Our rank" aria-label="Our regional rank" value={rank} onChange={(e) => setRank(e.target.value)} />
          <input
            className="input"
            inputMode="decimal"
            placeholder={pb ? `Our best (${formatScore(scoreOf(pb, metric), metric)})` : 'Our best'}
            aria-label="Our best score"
            value={best}
            onChange={(e) => setBest(e.target.value)}
          />
          <input className="input" inputMode="decimal" placeholder="2nd-place score" aria-label="Second place score" value={cutoff} onChange={(e) => setCutoff(e.target.value)} />
          <input className="input" placeholder="Note" aria-label="Snapshot note" value={note} onChange={(e) => setNote(e.target.value)} />
          <button className="btn btn-secondary col-span-2 sm:col-span-1">Save snapshot</button>
        </form>
      )}
      <ErrorNote error={error} />
      {list.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-xs text-slate-500">
              <tr>
                <th className="py-1 font-medium">When</th>
                <th className="py-1 font-medium">Rank</th>
                <th className="py-1 font-medium">Our best</th>
                <th className="py-1 font-medium">2nd place</th>
                <th className="py-1 font-medium">Note</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {list.map((s) => (
                <tr key={s.id} className="border-t border-slate-100 dark:border-slate-800">
                  <td className="py-1.5 whitespace-nowrap">{formatLocal(s.captured_at)}</td>
                  <td className="py-1.5">{s.our_rank_region ?? '—'}</td>
                  <td className="py-1.5 tabular-nums">{formatScore(s.our_best, metric)}</td>
                  <td className="py-1.5 tabular-nums">{formatScore(s.cutoff_rank2_score, metric)}</td>
                  <td className="py-1.5 text-slate-500">{s.note}</td>
                  <td className="py-1.5 text-right">
                    {canEdit && (
                      <button className="text-xs text-slate-400 hover:text-rose-600" aria-label="Delete snapshot" onClick={() => remove.mutate(s.id)}>
                        ✕
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  )
}

function TimeLogCard({ roundId }: { roundId: string }) {
  const { canEdit } = useTeam()
  const { data: logs = [] } = useRows('time_logs')
  const { data: members = [] } = useRows('members')
  const { data: attempts = [] } = useRows('attempts')
  const { insert, remove } = useMutations('time_logs')
  const memberName = useMemberName()
  const [minutes, setMinutes] = useState('')
  const [memberId, setMemberId] = useState('')
  const [note, setNote] = useState('')
  const list = logs.filter((l) => l.round_id === roundId).sort((a, b) => b.logged_on.localeCompare(a.logged_on))

  const perMember = new Map<string, number>()
  for (const l of list) perMember.set(l.member_id ?? '', (perMember.get(l.member_id ?? '') ?? 0) + l.minutes)
  for (const a of attempts.filter((x) => x.round_id === roundId))
    perMember.set(a.operator_id ?? '', (perMember.get(a.operator_id ?? '') ?? 0) + (a.minutes_spent ?? 0))

  return (
    <Card className="space-y-3">
      <h2 className="section-title">Hours</h2>
      <p className="text-sm text-slate-500">
        Attempt minutes count automatically. Log other prep here (research, reviewing reports). Top teams report ~80 hours
        per round.
      </p>
      <div className="flex flex-wrap gap-2">
        {[...perMember.entries()]
          .filter(([, m]) => m > 0)
          .map(([id, m]) => (
            <span key={id} className="chip text-sm">
              {id ? memberName(id) : 'Unassigned'}: {(m / 60).toFixed(1)}h
            </span>
          ))}
      </div>
      {canEdit && (
        <form
          className="grid grid-cols-2 gap-2 sm:grid-cols-4"
          onSubmit={(e) => {
            e.preventDefault()
            const n = parseNum(minutes)
            if (!n || n <= 0) return
            insert.mutate({
              id: newId(),
              round_id: roundId,
              member_id: memberId || null,
              minutes: Math.round(n),
              logged_on: todayISODate(),
              note: note.trim() || null,
            })
            setMinutes('')
            setNote('')
          }}
        >
          <input className="input" inputMode="numeric" placeholder="Minutes" aria-label="Minutes" value={minutes} onChange={(e) => setMinutes(e.target.value)} />
          <select className="input" aria-label="Who" value={memberId} onChange={(e) => setMemberId(e.target.value)}>
            <option value="">Who?</option>
            {members.map((m) => (
              <option key={m.id} value={m.id}>
                {m.display_name}
              </option>
            ))}
          </select>
          <input className="input" placeholder="What (optional)" aria-label="Time note" value={note} onChange={(e) => setNote(e.target.value)} />
          <button className="btn btn-secondary">Log time</button>
        </form>
      )}
      {list.length > 0 && (
        <ul className="divide-y divide-slate-100 text-sm dark:divide-slate-800">
          {list.slice(0, 10).map((l) => (
            <li key={l.id} className="flex items-center justify-between gap-2 py-1.5">
              <span>
                {l.logged_on} · {memberName(l.member_id)} · {l.minutes} min {l.note && <span className="text-slate-500">— {l.note}</span>}
              </span>
              {canEdit && (
                <button className="text-xs text-slate-400 hover:text-rose-600" aria-label="Delete time entry" onClick={() => remove.mutate(l.id)}>
                  ✕
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}

export function RoundPage() {
  const { round, isLoading } = useActiveRound()
  const { data: windows = [] } = useRows('round_windows')
  const now = useNow(1000 * 30)
  if (isLoading) return <Spinner />
  if (!round) return <p>No round selected.</p>
  const phase = roundPhase(round, now)
  const roundWindows = windows.filter((w) => w.round_id === round.id).sort((a, b) => a.opens_at.localeCompare(b.opens_at))

  return (
    <div className="space-y-4">
      <PageHeader
        title={round.label}
        subtitle={
          round.opens_at
            ? phase === 'upcoming'
              ? `Opens in ${formatDuration(Date.parse(round.opens_at) - now.getTime())}`
              : phase === 'open'
                ? `Open — closes in ${formatDuration(Date.parse(round.closes_at!) - now.getTime())}`
                : 'Closed'
            : 'Practice'
        }
      />
      {round.opens_at && (
        <Card className="space-y-2">
          <h2 className="section-title">Schedule (Eastern Time)</h2>
          <Field label="Main window">
            <p>
              {formatET(round.opens_at)} → {formatET(round.closes_at)}
            </p>
          </Field>
          {roundWindows.map((w) => (
            <div key={w.id} className="flex flex-wrap items-center justify-between gap-2 text-sm">
              <span className="font-medium">
                {w.label} {!w.verified && <span className="chip ml-1">unverified</span>}
              </span>
              <span className="text-slate-600 dark:text-slate-400">
                {formatET(w.opens_at)} → {formatET(w.closes_at)}
              </span>
            </div>
          ))}
          {round.notes && <p className="text-sm text-slate-500">{round.notes}</p>}
        </Card>
      )}
      <Checklist roundId={round.id} />
      {round.kind !== 'practice' && <Leaderboard roundId={round.id} />}
      <TimeLogCard roundId={round.id} />
    </div>
  )
}
