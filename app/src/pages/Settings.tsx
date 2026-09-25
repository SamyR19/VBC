import { useQueryClient } from '@tanstack/react-query'
import { useRef, useState } from 'react'
import { Card, ErrorNote, Field, PageHeader, TagInput, numToInput, parseNum } from '../components/ui'
import { attemptsToCsv, download, exportBackup, importBackup, isBackup } from '../lib/data'
import { BUSINESS_TYPES, METRIC_LABELS } from '../lib/season'
import { newId } from '../lib/store/store'
import type { CompetitionMode, Metric, Round, RoundKind, RoundWindow } from '../lib/types'
import { etInputToIso, isoToEtInput } from '../lib/time'
import { useTeam } from '../state/app'
import { useActiveRound, useInvalidateAll, useMemberName, useMutations, useRows } from '../state/data'

function TeamCard() {
  const { team, store, setTeam, canEdit } = useTeam()
  const [error, setError] = useState<unknown>(null)
  const save = async (patch: Parameters<typeof store.updateTeam>[1]) => {
    setError(null)
    try {
      setTeam(await store.updateTeam(team.id, patch))
    } catch (e) {
      setError(e)
    }
  }
  return (
    <Card className="space-y-4">
      <h2 className="section-title">Team</h2>
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Team name" htmlFor="set-name">
          <input
            id="set-name"
            className="input"
            defaultValue={team.name}
            disabled={!canEdit}
            onBlur={(e) => e.target.value.trim() && e.target.value !== team.name && void save({ name: e.target.value.trim() })}
          />
        </Field>
        <Field label="Default business" htmlFor="set-biz">
          <select
            id="set-biz"
            className="input"
            value={team.business_type ?? ''}
            disabled={!canEdit}
            onChange={(e) => void save({ business_type: e.target.value || null })}
          >
            <option value="">Not chosen</option>
            {BUSINESS_TYPES.map((b) => (
              <option key={b}>{b}</option>
            ))}
          </select>
        </Field>
        <Field
          label="Competition mode"
          htmlFor="set-comp"
          hint="Auto turns on the warning banner while a round or mini-challenge window is open."
        >
          <select
            id="set-comp"
            className="input"
            value={team.competition_mode}
            disabled={!canEdit}
            onChange={(e) => void save({ competition_mode: e.target.value as CompetitionMode })}
          >
            <option value="auto">Auto (during rounds)</option>
            <option value="on">Always on</option>
            <option value="off">Off</option>
          </select>
        </Field>
      </div>
      <Field
        label="Decision presets"
        htmlFor="set-keys"
        hint="Suggested names in the decision editor. Rename these to match the sim's actual screens after your first practice run."
      >
        {canEdit ? (
          <TagInput id="set-keys" value={team.decision_keys ?? []} onChange={(v) => void save({ decision_keys: v })} />
        ) : (
          <p className="text-sm">{(team.decision_keys ?? []).join(', ')}</p>
        )}
      </Field>
      <ErrorNote error={error} />
    </Card>
  )
}

function MembersCard() {
  const { mode, team, me, canEdit, cloudStore, setTeam } = useTeam()
  const { data: members = [] } = useRows('members')
  const { insert, update, remove } = useMutations('members')
  const [name, setName] = useState('')
  const [error, setError] = useState<unknown>(null)

  return (
    <Card className="space-y-3">
      <h2 className="section-title">Members</h2>
      {mode === 'cloud' && (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-slate-100 p-3 dark:bg-slate-800">
          <div>
            <div className="text-xs text-slate-500">Join code — share only with your teammates and advisor</div>
            <div className="font-mono text-xl font-bold tracking-widest">{team.join_code}</div>
          </div>
          {canEdit && (
            <button
              className="btn btn-secondary"
              onClick={async () => {
                if (!confirm('Generate a new code? The old one stops working.')) return
                try {
                  const code = await cloudStore!.rotateJoinCode(team.id)
                  setTeam({ ...team, join_code: code })
                } catch (e) {
                  setError(e)
                }
              }}
            >
              New code
            </button>
          )}
        </div>
      )}
      <ul className="divide-y divide-slate-100 dark:divide-slate-800">
        {members.map((m) => (
          <li key={m.id} className="flex flex-wrap items-center gap-2 py-2">
            <input
              className="input max-w-48"
              aria-label={`Name for ${m.display_name}`}
              defaultValue={m.display_name}
              disabled={!canEdit}
              onBlur={(e) =>
                e.target.value.trim() &&
                e.target.value !== m.display_name &&
                update.mutate({ id: m.id, patch: { display_name: e.target.value.trim() } })
              }
            />
            <span className="chip">{m.role}</span>
            {mode === 'cloud' && <span className="text-xs text-slate-500">{m.user_id ? (m.id === me?.id ? 'you' : 'signed up') : 'name only'}</span>}
            {canEdit && m.id !== me?.id && (
              <button
                className="btn btn-ghost ml-auto"
                onClick={() => confirm(`Remove ${m.display_name} from the team?`) && remove.mutate(m.id)}
              >
                Remove
              </button>
            )}
          </li>
        ))}
      </ul>
      {canEdit && (
        <form
          className="flex gap-2"
          onSubmit={async (e) => {
            e.preventDefault()
            if (!name.trim()) return
            try {
              await insert.mutateAsync({ id: newId(), user_id: null, display_name: name.trim(), role: 'student' })
              setName('')
            } catch (err) {
              setError(err)
            }
          }}
        >
          <input className="input" placeholder="Add a teammate by name" aria-label="New member name" value={name} onChange={(e) => setName(e.target.value)} />
          <button className="btn btn-secondary shrink-0">Add</button>
        </form>
      )}
      <ErrorNote error={error} />
    </Card>
  )
}

function WindowRow({ w, canEdit }: { w: RoundWindow; canEdit: boolean }) {
  const { update, remove } = useMutations('round_windows')
  return (
    <div className="grid grid-cols-2 items-end gap-2 sm:grid-cols-[1fr_1fr_1fr_auto_auto]">
      <input
        className="input"
        aria-label="Window label"
        defaultValue={w.label}
        disabled={!canEdit}
        onBlur={(e) => e.target.value !== w.label && update.mutate({ id: w.id, patch: { label: e.target.value } })}
      />
      <input
        type="datetime-local"
        className="input"
        aria-label={`${w.label} opens (ET)`}
        defaultValue={isoToEtInput(w.opens_at)}
        disabled={!canEdit}
        onBlur={(e) => {
          const iso = etInputToIso(e.target.value)
          if (iso && iso !== w.opens_at) update.mutate({ id: w.id, patch: { opens_at: iso } })
        }}
      />
      <input
        type="datetime-local"
        className="input"
        aria-label={`${w.label} closes (ET)`}
        defaultValue={isoToEtInput(w.closes_at)}
        disabled={!canEdit}
        onBlur={(e) => {
          const iso = etInputToIso(e.target.value)
          if (iso && iso !== w.closes_at) update.mutate({ id: w.id, patch: { closes_at: iso } })
        }}
      />
      <label className="flex items-center gap-1 text-sm">
        <input
          type="checkbox"
          checked={w.verified}
          disabled={!canEdit}
          onChange={(e) => update.mutate({ id: w.id, patch: { verified: e.target.checked } })}
        />
        verified
      </label>
      {canEdit && (
        <button className="btn btn-ghost" aria-label={`Delete ${w.label}`} onClick={() => confirm('Delete this window?') && remove.mutate(w.id)}>
          ✕
        </button>
      )}
    </div>
  )
}

function RoundEditor({ r }: { r: Round }) {
  const { canEdit } = useTeam()
  const { data: windows = [] } = useRows('round_windows')
  const { data: attempts = [] } = useRows('attempts')
  const { update, remove } = useMutations('rounds')
  const winMut = useMutations('round_windows')
  const [open, setOpen] = useState(false)
  const list = windows.filter((w) => w.round_id === r.id).sort((a, b) => a.opens_at.localeCompare(b.opens_at))
  const patch = (p: Partial<Round>) => update.mutate({ id: r.id, patch: p })

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-800">
      <button className="flex w-full items-center justify-between gap-2 p-3 text-left" onClick={() => setOpen(!open)} aria-expanded={open}>
        <span className="font-medium">{r.label}</span>
        <span className="flex items-center gap-2 text-xs text-slate-500">
          {METRIC_LABELS[r.ranking_metric]}
          {!r.metric_verified && r.kind !== 'practice' && <span className="chip bg-amber-100 text-amber-800">unverified</span>}
          <span aria-hidden>{open ? '▴' : '▾'}</span>
        </span>
      </button>
      {open && (
        <div className="space-y-4 border-t border-slate-200 p-3 dark:border-slate-800">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Label" htmlFor={`rl-${r.id}`}>
              <input
                id={`rl-${r.id}`}
                className="input"
                defaultValue={r.label}
                disabled={!canEdit}
                onBlur={(e) => e.target.value.trim() && e.target.value !== r.label && patch({ label: e.target.value.trim() })}
              />
            </Field>
            <Field label="Ranking metric" htmlFor={`rm-${r.id}`}>
              <div className="flex items-center gap-3">
                <select
                  id={`rm-${r.id}`}
                  className="input"
                  value={r.ranking_metric}
                  disabled={!canEdit}
                  onChange={(e) => patch({ ranking_metric: e.target.value as Metric })}
                >
                  {(Object.keys(METRIC_LABELS) as Metric[]).map((m) => (
                    <option key={m} value={m}>
                      {METRIC_LABELS[m]}
                    </option>
                  ))}
                </select>
                <label className="flex shrink-0 items-center gap-1 text-sm">
                  <input
                    type="checkbox"
                    checked={r.metric_verified}
                    disabled={!canEdit}
                    onChange={(e) => patch({ metric_verified: e.target.checked })}
                  />
                  verified
                </label>
              </div>
            </Field>
            <Field label="Opens (Eastern Time)" htmlFor={`ro-${r.id}`}>
              <input
                id={`ro-${r.id}`}
                type="datetime-local"
                className="input"
                defaultValue={isoToEtInput(r.opens_at)}
                disabled={!canEdit}
                onBlur={(e) => {
                  const iso = etInputToIso(e.target.value)
                  if (iso !== r.opens_at) patch({ opens_at: iso })
                }}
              />
            </Field>
            <Field label="Closes (Eastern Time)" htmlFor={`rc-${r.id}`}>
              <input
                id={`rc-${r.id}`}
                type="datetime-local"
                className="input"
                defaultValue={isoToEtInput(r.closes_at)}
                disabled={!canEdit}
                onBlur={(e) => {
                  const iso = etInputToIso(e.target.value)
                  if (iso !== r.closes_at) patch({ closes_at: iso })
                }}
              />
            </Field>
            <Field label="Estimated qualifying cutoff" htmlFor={`rq-${r.id}`} hint="Used until you save a leaderboard snapshot.">
              <input
                id={`rq-${r.id}`}
                className="input"
                inputMode="decimal"
                defaultValue={numToInput(r.est_qualifying_cutoff)}
                disabled={!canEdit}
                onBlur={(e) => patch({ est_qualifying_cutoff: parseNum(e.target.value) })}
              />
            </Field>
            <Field label="Notes" htmlFor={`rn-${r.id}`}>
              <input
                id={`rn-${r.id}`}
                className="input"
                defaultValue={r.notes ?? ''}
                disabled={!canEdit}
                onBlur={(e) => e.target.value !== (r.notes ?? '') && patch({ notes: e.target.value || null })}
              />
            </Field>
          </div>
          <div className="space-y-2">
            <div className="section-title">Mini-challenges / sessions (ET)</div>
            {list.map((w) => (
              <WindowRow key={w.id} w={w} canEdit={canEdit} />
            ))}
            {canEdit && (
              <button
                className="btn btn-secondary"
                onClick={() => {
                  const start = r.opens_at ?? new Date().toISOString()
                  winMut.insert.mutate({
                    id: newId(),
                    round_id: r.id,
                    label: `Window ${list.length + 1}`,
                    opens_at: start,
                    closes_at: r.closes_at ?? start,
                    verified: false,
                  })
                }}
              >
                + Add window
              </button>
            )}
          </div>
          {canEdit && (
            <button
              className="btn btn-danger"
              onClick={() => {
                const n = attempts.filter((a) => a.round_id === r.id).length
                if (n > 0) return alert(`This round has ${n} attempts. Move or delete them first.`)
                if (confirm(`Delete ${r.label}?`)) remove.mutate(r.id)
              }}
            >
              Delete round
            </button>
          )}
        </div>
      )}
    </div>
  )
}

function RoundsCard() {
  const { canEdit } = useTeam()
  const { rounds } = useActiveRound()
  const { insert } = useMutations('rounds')
  return (
    <Card className="space-y-3">
      <h2 className="section-title">Rounds & scoring</h2>
      <p className="text-sm text-slate-500">
        Seeded from reported 2026-27 dates. Verify against the official 2026-27 VBC Guidelines PDF, then tick
        "verified". Changing the metric recalculates every personal best instantly.
      </p>
      <div className="space-y-2">
        {rounds.map((r) => (
          <RoundEditor key={r.id} r={r} />
        ))}
      </div>
      {canEdit && (
        <button
          className="btn btn-secondary"
          onClick={() =>
            insert.mutate({
              id: newId(),
              season: '2026-27',
              kind: 'practice' as RoundKind,
              label: 'New practice block',
              opens_at: null,
              closes_at: null,
              ranking_metric: 'profit',
              metric_verified: false,
              est_qualifying_cutoff: null,
              notes: null,
            })
          }
        >
          + Add round
        </button>
      )}
    </Card>
  )
}

function DataCard() {
  const { store, team, mode, canEdit, localStore, refresh } = useTeam()
  const { data: attempts = [] } = useRows('attempts')
  const { rounds } = useActiveRound()
  const memberName = useMemberName()
  const invalidate = useInvalidateAll()
  const qc = useQueryClient()
  const fileRef = useRef<HTMLInputElement>(null)
  const [msg, setMsg] = useState<string | null>(null)
  const [error, setError] = useState<unknown>(null)
  const stamp = new Date().toISOString().slice(0, 10)
  const slug = team.name.replace(/[^a-z0-9]+/gi, '-').toLowerCase()

  return (
    <Card className="space-y-3">
      <h2 className="section-title">Data</h2>
      {mode === 'local' && (
        <p className="text-sm text-amber-700 dark:text-amber-300">
          Local mode: your data lives only in this browser. Clearing site data or switching browsers loses it — export a
          backup after every session.
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        <button
          className="btn btn-secondary"
          onClick={() => download(`${slug}-attempts-${stamp}.csv`, attemptsToCsv(attempts, rounds, memberName), 'text/csv')}
        >
          Export attempts (CSV)
        </button>
        <button
          className="btn btn-secondary"
          onClick={async () => {
            const b = await exportBackup(store, team)
            download(`${slug}-backup-${stamp}.json`, JSON.stringify(b, null, 2), 'application/json')
          }}
        >
          Download full backup (JSON)
        </button>
        {canEdit && (
          <>
            <button className="btn btn-secondary" onClick={() => fileRef.current?.click()}>
              Import backup…
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="application/json,.json"
              className="hidden"
              aria-label="Backup file"
              onChange={async (e) => {
                const file = e.target.files?.[0]
                e.target.value = ''
                if (!file) return
                setMsg(null)
                setError(null)
                try {
                  const parsed = JSON.parse(await file.text())
                  if (!isBackup(parsed)) throw new Error('That file is not a VBC Run Logbook backup.')
                  if (!confirm(`Import ${parsed.tables.attempts?.length ?? 0} attempts from "${parsed.team.name}" into this team?`)) return
                  const n = await importBackup(store, team.id, parsed)
                  await invalidate()
                  setMsg(`Imported ${n} rows.`)
                } catch (err) {
                  setError(err)
                }
              }}
            />
          </>
        )}
      </div>
      {msg && <p className="text-sm text-emerald-600">{msg}</p>}
      <ErrorNote error={error} />
      {mode === 'local' && localStore && (
        <button
          className="btn btn-danger"
          onClick={async () => {
            if (!confirm('Erase ALL data on this device? Download a backup first.')) return
            localStore.clearAll()
            qc.clear()
            await refresh()
          }}
        >
          Erase this device
        </button>
      )}
    </Card>
  )
}

function AccountCard() {
  const { mode, session, memberships, team, selectTeam, signOut } = useTeam()
  if (mode !== 'cloud') return null
  return (
    <Card className="space-y-3">
      <h2 className="section-title">Account</h2>
      <p className="text-sm">Signed in as {session?.user.email}</p>
      {memberships.length > 1 && (
        <Field label="Switch team" htmlFor="switch-team">
          <select id="switch-team" className="input" value={team.id} onChange={(e) => selectTeam(e.target.value)}>
            {memberships.map((m) => (
              <option key={m.team_id} value={m.team_id}>
                {m.team.name} ({m.role})
              </option>
            ))}
          </select>
        </Field>
      )}
      <button className="btn btn-secondary" onClick={() => void signOut()}>
        Sign out
      </button>
    </Card>
  )
}

export function Settings() {
  return (
    <div className="space-y-4">
      <PageHeader title="Team settings" />
      <TeamCard />
      <MembersCard />
      <RoundsCard />
      <DataCard />
      <AccountCard />
      <Card className="space-y-1 text-sm text-slate-600 dark:text-slate-400">
        <h2 className="section-title">Integrity</h2>
        <p>
          DECA forbids external apps, extensions or browser tools inside the competition sim (immediate disqualification).
          This app never connects to the sim — log attempts after a run or from another device.
        </p>
        <p>
          Participants also pledge "no outside help". Ask Knowledge Matters (Support@KnowledgeMatters.com) in writing if
          you are unsure what counts.
        </p>
      </Card>
    </div>
  )
}
