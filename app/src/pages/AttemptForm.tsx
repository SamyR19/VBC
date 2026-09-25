import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { DecisionEditor } from '../components/DecisionEditor'
import { Card, ErrorNote, Field, PageHeader, Spinner, TagInput, numToInput, parseNum } from '../components/ui'
import { changedKeys, formatScore, personalBest, scoreOf } from '../lib/metrics'
import { BUSINESS_TYPES, DEFAULT_DECISION_KEYS, METRIC_LABELS } from '../lib/season'
import { newId, nowIso } from '../lib/store/store'
import type { Attempt, AttemptStatus, DecisionEntry, Metric, Verdict } from '../lib/types'
import { formatDate } from '../lib/time'
import { useTeam } from '../state/app'
import { useActiveRound, useMutations, useRows } from '../state/data'

interface FormState {
  round_id: string
  window_id: string
  operator_id: string
  parent_attempt_id: string
  business_type: string
  hypothesis: string
  decisions: DecisionEntry[]
  final_profit: string
  final_net_worth: string
  final_points: string
  cash_low_point: string
  loan_taken: '' | 'yes' | 'no'
  sim_periods_completed: string
  minutes_spent: string
  status: AttemptStatus
  verdict: '' | Verdict
  lesson: string
  tags: string[]
}

function fromAttempt(a: Attempt): FormState {
  return {
    round_id: a.round_id,
    window_id: a.window_id ?? '',
    operator_id: a.operator_id ?? '',
    parent_attempt_id: a.parent_attempt_id ?? '',
    business_type: a.business_type ?? '',
    hypothesis: a.hypothesis,
    decisions: a.decisions,
    final_profit: numToInput(a.final_profit),
    final_net_worth: numToInput(a.final_net_worth),
    final_points: numToInput(a.final_points),
    cash_low_point: numToInput(a.cash_low_point),
    loan_taken: a.loan_taken == null ? '' : a.loan_taken ? 'yes' : 'no',
    sim_periods_completed: numToInput(a.sim_periods_completed),
    minutes_spent: numToInput(a.minutes_spent),
    status: a.status,
    verdict: a.verdict ?? '',
    lesson: a.lesson ?? '',
    tags: a.tags,
  }
}

const attemptLabel = (a: Attempt, metric: Metric) =>
  `${formatDate(a.started_at)} · ${formatScore(scoreOf(a, metric), metric)} · ${a.hypothesis.slice(0, 40)}`

/** The operator last chosen on this device — usually the same person holds the phone. */
function lastOperator(teamId: string, memberIds: string[]): string {
  const id = localStorage.getItem(`vbc:operator:${teamId}`)
  return id && memberIds.includes(id) ? id : ''
}

export function AttemptForm() {
  const { id } = useParams()
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const { team, canEdit } = useTeam()
  const { rounds, round: activeRound, isLoading: roundsLoading } = useActiveRound()
  const { data: attempts = [], isLoading: attemptsLoading } = useRows('attempts')
  const { data: members = [] } = useRows('members')
  const { data: windows = [] } = useRows('round_windows')
  const { data: backlog = [] } = useRows('backlog')
  const { insert, update } = useMutations('attempts')
  const backlogMut = useMutations('backlog')

  const existing = id ? attempts.find((a) => a.id === id) : undefined
  const backlogId = params.get('backlog')
  const fromId = params.get('from')
  const [form, setForm] = useState<FormState | null>(null)
  const [error, setError] = useState<unknown>(null)
  const [busy, setBusy] = useState(false)

  // Initialise once the data we depend on is loaded.
  useEffect(() => {
    if (form || roundsLoading || attemptsLoading || !activeRound) return
    if (id) {
      if (existing) setForm(fromAttempt(existing))
      return
    }
    const roundId = activeRound.id
    const inRound = attempts.filter((a) => a.round_id === roundId)
    const from = fromId ? attempts.find((a) => a.id === fromId) : undefined
    const baseline = from ?? personalBest(inRound, activeRound.ranking_metric)
    const idea = backlogId ? backlog.find((b) => b.id === backlogId) : undefined
    setForm({
      round_id: roundId,
      window_id: '',
      operator_id: members.length === 1 ? members[0].id : lastOperator(team.id, members.map((m) => m.id)),
      parent_attempt_id: baseline?.id ?? '',
      business_type: baseline?.business_type ?? team.business_type ?? '',
      hypothesis: idea?.idea ?? '',
      decisions: baseline ? baseline.decisions.map((d) => ({ ...d })) : [],
      final_profit: '',
      final_net_worth: '',
      final_points: '',
      cash_low_point: '',
      loan_taken: '',
      sim_periods_completed: '',
      minutes_spent: '',
      status: 'completed',
      verdict: '',
      lesson: '',
      tags: [],
    })
  }, [form, roundsLoading, attemptsLoading, activeRound, id, existing, attempts, fromId, backlogId, backlog, members, team.business_type, team.id])

  const round = rounds.find((r) => r.id === form?.round_id) ?? activeRound
  const metric = round?.ranking_metric ?? 'profit'
  const baselineOptions = useMemo(
    () =>
      attempts
        .filter((a) => a.round_id === form?.round_id && a.id !== id && a.status === 'completed')
        .sort((a, b) => b.started_at.localeCompare(a.started_at)),
    [attempts, form?.round_id, id],
  )
  const baseline = attempts.find((a) => a.id === form?.parent_attempt_id)

  if (!canEdit) return <p className="text-slate-500">Advisors have read-only access.</p>
  if (!form) return id && !attemptsLoading && !existing ? <p>Attempt not found.</p> : <Spinner />

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) => setForm({ ...form, [k]: v })

  const save = async (asPlan: boolean) => {
    setError(null)
    if (!form.hypothesis.trim()) {
      setError(new Error('Write a hypothesis first — what are you testing, and what do you expect?'))
      return
    }
    const status: AttemptStatus = asPlan ? 'in_progress' : form.status === 'in_progress' ? 'completed' : form.status
    const decisions = form.decisions.filter((d) => d.key.trim())
    const payload = {
      round_id: form.round_id,
      window_id: form.window_id || null,
      operator_id: form.operator_id || null,
      parent_attempt_id: form.parent_attempt_id || null,
      business_type: form.business_type || null,
      hypothesis: form.hypothesis.trim(),
      variables_changed: baseline ? changedKeys(baseline.decisions, decisions) : [],
      decisions,
      status,
      final_profit: parseNum(form.final_profit),
      final_net_worth: parseNum(form.final_net_worth),
      final_points: parseNum(form.final_points),
      cash_low_point: parseNum(form.cash_low_point),
      loan_taken: form.loan_taken === '' ? null : form.loan_taken === 'yes',
      sim_periods_completed: parseNum(form.sim_periods_completed),
      minutes_spent: parseNum(form.minutes_spent),
      verdict: (form.verdict || null) as Verdict | null,
      lesson: form.lesson.trim() || null,
      tags: form.tags,
    }
    if (status === 'completed' && payload.final_profit == null && payload.final_net_worth == null && payload.final_points == null) {
      setError(new Error('Enter at least one final score (profit, net worth or points), or save as a plan.'))
      return
    }
    setBusy(true)
    if (form.operator_id) localStorage.setItem(`vbc:operator:${team.id}`, form.operator_id)
    try {
      let savedId: string
      if (existing) {
        const finished = status !== 'in_progress' && !existing.finished_at ? nowIso() : existing.finished_at
        await update.mutateAsync({ id: existing.id, patch: { ...payload, finished_at: finished } })
        savedId = existing.id
      } else {
        savedId = newId()
        await insert.mutateAsync({
          ...payload,
          id: savedId,
          backlog_id: backlogId,
          started_at: nowIso(),
          finished_at: status === 'in_progress' ? null : nowIso(),
        })
      }
      const linked = existing?.backlog_id ?? backlogId
      if (linked && status === 'completed') {
        await backlogMut.update.mutateAsync({ id: linked, patch: { status: 'tested', tested_attempt_id: savedId } })
      }
      navigate(asPlan ? '/' : `/attempts/${savedId}`)
    } catch (e) {
      setError(e)
    } finally {
      setBusy(false)
    }
  }

  const submit = (e: FormEvent) => {
    e.preventDefault()
    void save(false)
  }

  const roundWindows = windows.filter((w) => w.round_id === form.round_id)
  const keys = team.decision_keys?.length ? team.decision_keys : DEFAULT_DECISION_KEYS
  const liveChanged = baseline ? changedKeys(baseline.decisions, form.decisions.filter((d) => d.key.trim())) : []

  return (
    <form onSubmit={submit} className="space-y-4">
      <PageHeader
        title={existing ? (existing.status === 'in_progress' ? 'Log results' : 'Edit attempt') : 'New attempt'}
        subtitle="One change per run. Write the hypothesis before you open the sim."
      />

      <Card className="space-y-4">
        <h2 className="section-title">1 · Plan</h2>
        <Field
          label="Hypothesis"
          htmlFor="hypothesis"
          hint='e.g. "Raising price 10% in year 2 increases profit because demand stays flat."'
        >
          <textarea
            id="hypothesis"
            className="input min-h-20"
            required
            value={form.hypothesis}
            onChange={(e) => set('hypothesis', e.target.value)}
          />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Round" htmlFor="round">
            <select
              id="round"
              className="input"
              value={form.round_id}
              onChange={(e) => setForm({ ...form, round_id: e.target.value, window_id: '', parent_attempt_id: '' })}
            >
              {rounds.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.label}
                </option>
              ))}
            </select>
          </Field>
          {roundWindows.length > 0 && (
            <Field label="Mini-challenge (optional)" htmlFor="window">
              <select id="window" className="input" value={form.window_id} onChange={(e) => set('window_id', e.target.value)}>
                <option value="">Main round</option>
                {roundWindows.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.label}
                  </option>
                ))}
              </select>
            </Field>
          )}
          <Field label="Operator" htmlFor="operator">
            <select id="operator" className="input" value={form.operator_id} onChange={(e) => set('operator_id', e.target.value)}>
              <option value="">—</option>
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.display_name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Business" htmlFor="business">
            <select id="business" className="input" value={form.business_type} onChange={(e) => set('business_type', e.target.value)}>
              <option value="">—</option>
              {BUSINESS_TYPES.map((b) => (
                <option key={b}>{b}</option>
              ))}
            </select>
          </Field>
          <Field label="Baseline run" htmlFor="baseline" hint="The run this one varies from. Defaults to your PB.">
            <select
              id="baseline"
              className="input"
              value={form.parent_attempt_id}
              onChange={(e) => {
                const b = attempts.find((a) => a.id === e.target.value)
                setForm({
                  ...form,
                  parent_attempt_id: e.target.value,
                  decisions: !existing && b ? b.decisions.map((d) => ({ ...d })) : form.decisions,
                })
              }}
            >
              <option value="">None (fresh start)</option>
              {baselineOptions.map((a) => (
                <option key={a.id} value={a.id}>
                  {attemptLabel(a, metric)}
                </option>
              ))}
            </select>
          </Field>
        </div>
      </Card>

      <Card className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="section-title">2 · Decisions</h2>
          {baseline && (
            <span className={`text-sm ${liveChanged.length > 1 ? 'text-amber-600' : 'text-slate-500'}`}>
              {liveChanged.length === 0
                ? 'Same as baseline'
                : `Changed vs. baseline: ${liveChanged.join(', ')}`}
              {liveChanged.length > 1 && ' — more than one change makes the result hard to read'}
            </span>
          )}
        </div>
        <DecisionEditor
          value={form.decisions}
          onChange={(v) => set('decisions', v)}
          suggestions={keys}
          baseline={baseline?.decisions}
        />
      </Card>

      <Card className="space-y-4">
        <h2 className="section-title">3 · Results (after the run)</h2>
        <p className="text-sm text-slate-500">
          Ranking metric for {round?.label}: <strong>{METRIC_LABELS[metric]}</strong>. Fill in what the sim shows —
          storing all three protects you if the metric turns out to be different.
        </p>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <Field label="Final profit ($)" htmlFor="profit">
            <input id="profit" className="input" inputMode="decimal" value={form.final_profit} onChange={(e) => set('final_profit', e.target.value)} />
          </Field>
          <Field label="Final net worth ($)" htmlFor="networth">
            <input id="networth" className="input" inputMode="decimal" value={form.final_net_worth} onChange={(e) => set('final_net_worth', e.target.value)} />
          </Field>
          <Field label="Points" htmlFor="points">
            <input id="points" className="input" inputMode="decimal" value={form.final_points} onChange={(e) => set('final_points', e.target.value)} />
          </Field>
          <Field label="Lowest cash ($)" htmlFor="cashlow">
            <input id="cashlow" className="input" inputMode="decimal" value={form.cash_low_point} onChange={(e) => set('cash_low_point', e.target.value)} />
          </Field>
          <Field label="Periods completed" htmlFor="periods" hint="Weeks/months/years — whatever the sim uses.">
            <input id="periods" className="input" inputMode="numeric" value={form.sim_periods_completed} onChange={(e) => set('sim_periods_completed', e.target.value)} />
          </Field>
          <Field label="Minutes spent" htmlFor="minutes">
            <input id="minutes" className="input" inputMode="numeric" value={form.minutes_spent} onChange={(e) => set('minutes_spent', e.target.value)} />
          </Field>
          <Field label="Took a loan?" htmlFor="loan">
            <select id="loan" className="input" value={form.loan_taken} onChange={(e) => set('loan_taken', e.target.value as FormState['loan_taken'])}>
              <option value="">—</option>
              <option value="yes">Yes</option>
              <option value="no">No</option>
            </select>
          </Field>
          <Field label="Status" htmlFor="status">
            <select id="status" className="input" value={form.status === 'in_progress' ? 'completed' : form.status} onChange={(e) => set('status', e.target.value as AttemptStatus)}>
              <option value="completed">Completed</option>
              <option value="aborted">Aborted</option>
              <option value="bad_data">Bad data (exclude)</option>
            </select>
          </Field>
          <Field label="Verdict" htmlFor="verdict">
            <select id="verdict" className="input" value={form.verdict} onChange={(e) => set('verdict', e.target.value as FormState['verdict'])}>
              <option value="">—</option>
              <option value="keep">Keep the change</option>
              <option value="discard">Discard the change</option>
              <option value="inconclusive">Inconclusive</option>
            </select>
          </Field>
        </div>
        <Field label="Lesson learned" htmlFor="lesson">
          <textarea id="lesson" className="input min-h-16" value={form.lesson} onChange={(e) => set('lesson', e.target.value)} />
        </Field>
        <Field label="Tags" htmlFor="tags" hint="Press Enter or comma to add.">
          <TagInput id="tags" value={form.tags} onChange={(v) => set('tags', v)} placeholder="pricing, staffing…" />
        </Field>
      </Card>

      <ErrorNote error={error} />
      <div className="sticky bottom-20 z-10 flex flex-wrap justify-end gap-2 rounded-2xl bg-slate-50/90 py-2 backdrop-blur md:bottom-2 dark:bg-slate-950/90">
        <Link to={existing ? `/attempts/${existing.id}` : '/'} className="btn btn-ghost">
          Cancel
        </Link>
        {(!existing || existing.status === 'in_progress') && (
          <button type="button" className="btn btn-secondary" disabled={busy} onClick={() => void save(true)}>
            Save plan, run later
          </button>
        )}
        <button className="btn btn-primary" disabled={busy}>
          Save results
        </button>
      </div>
    </form>
  )
}
