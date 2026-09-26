import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { DecisionEditor } from '../components/DecisionEditor'
import { Card, ErrorNote, Field, PageHeader, Spinner, TagInput, numToInput, parseNum } from '../components/ui'
import { changedKeys, formatScore, personalBest, scoreOf } from '../lib/metrics'
import { BUSINESS_TYPES, DEFAULT_DECISION_KEYS, DEFAULT_PERIODS, METRIC_LABELS } from '../lib/season'
import { newId, nowIso } from '../lib/store/store'
import type { Attempt, AttemptStatus, Checkpoint, DecisionEntry, Member, Metric, Verdict } from '../lib/types'
import { formatDate } from '../lib/time'
import { useTeam } from '../state/app'
import { useCoachPage } from '../state/coach'
import { useActiveRound, useMutations, useRows } from '../state/data'

// Numeric result fields, all kept as strings while editing.
const NUM_FIELDS = [
  'final_profit',
  'final_net_worth',
  'final_points',
  'final_revenue',
  'final_expenses',
  'ending_cash',
  'cash_low_point',
  'total_debt',
  'interest_paid',
  'customer_satisfaction',
  'employees',
  'locations',
  'sim_periods_completed',
  'minutes_spent',
] as const
type NumField = (typeof NUM_FIELDS)[number]

interface CheckpointDraft {
  period: string
  profit: string
  net_worth: string
  cash: string
  revenue: string
  note: string
}

type FormState = {
  round_id: string
  window_id: string
  operator_id: string
  parent_attempt_id: string
  business_type: string
  hypothesis: string
  decisions: DecisionEntry[]
  loan_taken: '' | 'yes' | 'no'
  checkpoints: CheckpointDraft[]
  status: AttemptStatus
  verdict: '' | Verdict
  run_notes: string
  lesson: string
  tags: string[]
} & Record<NumField, string>

const emptyNums = () => Object.fromEntries(NUM_FIELDS.map((k) => [k, ''])) as Record<NumField, string>

function fromAttempt(a: Attempt): FormState {
  return {
    round_id: a.round_id,
    window_id: a.window_id ?? '',
    operator_id: a.operator_id ?? '',
    parent_attempt_id: a.parent_attempt_id ?? '',
    business_type: a.business_type ?? '',
    hypothesis: a.hypothesis,
    decisions: a.decisions,
    ...(Object.fromEntries(NUM_FIELDS.map((k) => [k, numToInput(a[k])])) as Record<NumField, string>),
    loan_taken: a.loan_taken == null ? '' : a.loan_taken ? 'yes' : 'no',
    checkpoints: (a.checkpoints ?? []).map((c) => ({
      period: c.period,
      profit: numToInput(c.profit),
      net_worth: numToInput(c.net_worth),
      cash: numToInput(c.cash),
      revenue: numToInput(c.revenue),
      note: c.note ?? '',
    })),
    status: a.status,
    verdict: a.verdict ?? '',
    run_notes: a.run_notes ?? '',
    lesson: a.lesson ?? '',
    tags: a.tags,
  }
}

const attemptLabel = (a: Attempt, metric: Metric) =>
  `${formatDate(a.started_at)} · ${formatScore(scoreOf(a, metric), metric)} · ${a.hypothesis.slice(0, 40)}`

/**
 * Default operator: the signed-in teammate (team mode), else whoever this device logged last,
 * else the first member (usually the person who set the team up).
 */
function defaultOperator(teamId: string, members: Member[], me: Member | null): string {
  if (me && members.some((m) => m.id === me.id)) return me.id
  const last = localStorage.getItem(`vbc:operator:${teamId}`)
  if (last && members.some((m) => m.id === last)) return last
  const students = members.filter((m) => m.role === 'student')
  return students[0]?.id ?? ''
}

function Section({ n, title, subtitle, children }: { n: number; title: string; subtitle?: ReactNode; children: ReactNode }) {
  return (
    <Card className="space-y-4">
      <div>
        <h2 className="flex items-center gap-2 font-semibold">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-600 text-xs font-bold text-white">{n}</span>
          {title}
        </h2>
        {subtitle && <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{subtitle}</p>}
      </div>
      {children}
    </Card>
  )
}

function Num({
  id,
  label,
  hint,
  value,
  onChange,
  prefix,
  suffix,
}: {
  id: string
  label: string
  hint?: string
  value: string
  onChange: (v: string) => void
  prefix?: string
  suffix?: string
}) {
  return (
    <Field label={label} htmlFor={id} hint={hint}>
      <div className="relative">
        {prefix && <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-slate-400">{prefix}</span>}
        <input
          id={id}
          className={`input tabular-nums ${prefix ? 'pl-7' : ''} ${suffix ? 'pr-8' : ''}`}
          inputMode="decimal"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
        {suffix && <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-slate-400">{suffix}</span>}
      </div>
    </Field>
  )
}

export function AttemptForm() {
  const { id } = useParams()
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const { team, canEdit, me } = useTeam()
  const { rounds, round: activeRound, isLoading: roundsLoading } = useActiveRound()
  const { data: attempts = [], isLoading: attemptsLoading } = useRows('attempts')
  const { data: members = [], isLoading: membersLoading } = useRows('members')
  const { data: windows = [] } = useRows('round_windows')
  const { data: backlog = [] } = useRows('backlog')
  const { insert, update } = useMutations('attempts')
  const backlogMut = useMutations('backlog')

  const existing = id ? attempts.find((a) => a.id === id) : undefined
  const backlogId = params.get('backlog')
  const fromId = params.get('from')
  const [form, setForm] = useState<FormState | null>(null)
  const [showSplits, setShowSplits] = useState(false)
  const [error, setError] = useState<unknown>(null)
  const [busy, setBusy] = useState(false)

  // Initialise once the data we depend on is loaded.
  useEffect(() => {
    if (form || roundsLoading || attemptsLoading || membersLoading || !activeRound) return
    if (id) {
      if (existing) {
        setForm(fromAttempt(existing))
        setShowSplits((existing.checkpoints ?? []).length > 0)
      }
      return
    }
    const roundId = activeRound.id
    const inRound = attempts.filter((a) => a.round_id === roundId)
    const from = fromId ? attempts.find((a) => a.id === fromId) : undefined
    const baseline = from ?? personalBest(inRound, activeRound.ranking_metric)
    const idea = backlogId ? backlog.find((b) => b.id === backlogId) : undefined
    let decisions = baseline ? baseline.decisions.map((d) => ({ ...d })) : []
    // An idea with a concrete "to" value pre-applies the change.
    if (idea?.variable && idea.to_value) {
      const k = idea.variable.trim().toLowerCase()
      const i = decisions.findIndex((d) => d.key.trim().toLowerCase() === k)
      if (i >= 0) decisions = decisions.map((d, j) => (j === i ? { ...d, value: idea.to_value! } : d))
      else decisions = [...decisions, { key: idea.variable, value: idea.to_value, group: idea.category ?? undefined }]
    }
    setForm({
      round_id: roundId,
      window_id: '',
      operator_id: defaultOperator(team.id, members, me),
      parent_attempt_id: baseline?.id ?? '',
      business_type: baseline?.business_type ?? team.business_type ?? '',
      hypothesis: idea ? [idea.idea, idea.expected_effect && `Expect: ${idea.expected_effect}`].filter(Boolean).join(' — ') : '',
      decisions,
      ...emptyNums(),
      loan_taken: '',
      checkpoints: [],
      status: 'completed',
      verdict: '',
      run_notes: '',
      lesson: '',
      tags: idea?.category ? [idea.category.toLowerCase()] : [],
    })
  }, [form, roundsLoading, attemptsLoading, membersLoading, activeRound, id, existing, attempts, fromId, backlogId, backlog, members, me, team.business_type, team.id])

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
  const liveChanged = baseline && form ? changedKeys(baseline.decisions, form.decisions.filter((d) => d.key.trim())) : []

  useCoachPage(
    existing ? 'Editing an attempt' : 'Logging a new attempt',
    form
      ? [
          `Draft hypothesis: ${form.hypothesis || '(empty)'}`,
          baseline ? `Baseline run: "${baseline.hypothesis}" scoring ${formatScore(scoreOf(baseline, metric), metric)}` : 'No baseline selected',
          `Decisions changed vs baseline: ${liveChanged.join(', ') || 'none yet'}`,
          `Draft decisions: ${form.decisions.map((d) => `${d.key}=${d.value}`).join('; ') || '(none)'}`,
        ].join('\n')
      : '',
  )

  if (!canEdit) return <p className="text-slate-500">Advisors have read-only access.</p>
  if (!form) return id && !attemptsLoading && !existing ? <p>Attempt not found.</p> : <Spinner />

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) => setForm({ ...form, [k]: v })
  const setCheckpoint = (i: number, patch: Partial<CheckpointDraft>) =>
    set(
      'checkpoints',
      form.checkpoints.map((c, j) => (j === i ? { ...c, ...patch } : c)),
    )

  const save = async (asPlan: boolean) => {
    setError(null)
    if (!form.hypothesis.trim()) {
      setError(new Error('Step 1: write a hypothesis first — what are you changing, and what do you expect to happen?'))
      return
    }
    const status: AttemptStatus = asPlan ? 'in_progress' : form.status === 'in_progress' ? 'completed' : form.status
    const decisions = form.decisions.filter((d) => d.key.trim() && d.value.trim())
    const nums = Object.fromEntries(NUM_FIELDS.map((k) => [k, parseNum(form[k])])) as Record<NumField, number | null>
    const checkpoints: Checkpoint[] = form.checkpoints
      .map((c) => ({
        period: c.period.trim(),
        profit: parseNum(c.profit),
        net_worth: parseNum(c.net_worth),
        cash: parseNum(c.cash),
        revenue: parseNum(c.revenue),
        note: c.note.trim() || null,
      }))
      .filter((c) => c.period && (c.profit != null || c.net_worth != null || c.cash != null || c.revenue != null || c.note))
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
      ...nums,
      loan_taken: form.loan_taken === '' ? null : form.loan_taken === 'yes',
      checkpoints,
      verdict: (form.verdict || null) as Verdict | null,
      run_notes: form.run_notes.trim() || null,
      lesson: form.lesson.trim() || null,
      tags: form.tags,
    }
    if (status === 'completed' && nums.final_profit == null && nums.final_net_worth == null && nums.final_points == null) {
      setError(new Error('Step 3: enter at least one final score (profit, net worth or points) — or use "Save plan, run later".'))
      return
    }
    if (nums.customer_satisfaction != null && (nums.customer_satisfaction < 0 || nums.customer_satisfaction > 100)) {
      setError(new Error('Customer satisfaction should be a percentage between 0 and 100.'))
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
  const linkedIdea = backlog.find((b) => b.id === (existing?.backlog_id ?? backlogId))
  const num = (k: NumField) => ({ id: k, value: form[k], onChange: (v: string) => set(k, v) })

  return (
    <form onSubmit={submit} className="space-y-4">
      <PageHeader
        title={existing ? (existing.status === 'in_progress' ? 'Log results' : 'Edit attempt') : 'New attempt'}
        subtitle="Steps 1–2 before you open the sim. Steps 3–5 right after the run ends."
      />

      {linkedIdea && (
        <div className="rounded-xl border border-brand-100 bg-brand-50 p-3 text-sm dark:border-slate-700 dark:bg-slate-900">
          <div className="font-medium">Testing idea: {linkedIdea.idea}</div>
          {(linkedIdea.variable || linkedIdea.to_value) && (
            <div className="mt-1 text-slate-600 dark:text-slate-400">
              {linkedIdea.variable}: {linkedIdea.from_value || '?'} → {linkedIdea.to_value || '?'}
            </div>
          )}
          {linkedIdea.rationale && <div className="mt-1 text-slate-600 dark:text-slate-400">Why: {linkedIdea.rationale}</div>}
        </div>
      )}

      <Section n={1} title="Plan the run" subtitle="Say what you will change and what you expect, before touching the sim.">
        <Field
          label="Hypothesis"
          htmlFor="hypothesis"
          hint='Format: "Change [decision] from [old] to [new] because [reason]; I expect [score] to go up/down." One change only.'
        >
          <textarea
            id="hypothesis"
            className="input min-h-20"
            required
            placeholder="Raise main price from $5.00 to $5.50 because customers weren't price-sensitive last run; expect higher profit."
            value={form.hypothesis}
            onChange={(e) => set('hypothesis', e.target.value)}
          />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Round" htmlFor="round" hint="Which competition window this run counts toward.">
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
            <Field label="Mini-challenge (optional)" htmlFor="window" hint="Only if this run was for a mini-challenge.">
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
          <Field label="Operator" htmlFor="operator" hint="Who is running the sim. Defaults to you.">
            <select id="operator" className="input" value={form.operator_id} onChange={(e) => set('operator_id', e.target.value)}>
              <option value="">—</option>
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.display_name}
                  {me?.id === m.id ? ' (you)' : ''}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Business" htmlFor="business" hint="Which of the 20 businesses you chose in the sim.">
            <select id="business" className="input" value={form.business_type} onChange={(e) => set('business_type', e.target.value)}>
              <option value="">—</option>
              {BUSINESS_TYPES.map((b) => (
                <option key={b}>{b}</option>
              ))}
            </select>
          </Field>
          <div className="sm:col-span-2">
            <Field label="Baseline run" htmlFor="baseline" hint="The run you're copying and changing one thing from. Defaults to your best run (PB). Its decisions are filled in below.">
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
        </div>
      </Section>

      <Section
        n={2}
        title="Record your decisions"
        subtitle={
          baseline ? (
            <span className={liveChanged.length > 1 ? 'text-amber-600' : ''}>
              {liveChanged.length === 0
                ? 'Same as the baseline so far — change the one decision you are testing.'
                : `Changed vs. baseline: ${liveChanged.join(', ')}.`}
              {liveChanged.length > 1 && ' More than one change makes it impossible to tell which one mattered.'}
            </span>
          ) : (
            'Open each area and type the exact values you set in the sim. Leave anything the sim didn’t ask blank.'
          )
        }
      >
        <DecisionEditor value={form.decisions} onChange={(v) => set('decisions', v)} suggestions={keys} baseline={baseline?.decisions} />
      </Section>

      <Section
        n={3}
        title="Final results (from the sim’s reports)"
        subtitle={
          <>
            Round ranks on <strong>{METRIC_LABELS[metric]}</strong>. Copy numbers from the end-of-run reports (income statement, balance
            sheet / financial summary). Type plain numbers — $ and commas are fine.
          </>
        }
      >
        <div>
          <h3 className="section-title mb-2">Score</h3>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <Num {...num('final_profit')} label="Final profit" prefix="$" hint="Cumulative net profit for the whole run." />
            <Num {...num('final_net_worth')} label="Final net worth" prefix="$" hint="Assets minus debts (Personal Financial Summary)." />
            <Num {...num('final_points')} label="Points" hint="Only if the sim shows a points score." />
          </div>
        </div>
        <div>
          <h3 className="section-title mb-2">Money</h3>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Num {...num('final_revenue')} label="Total revenue" prefix="$" hint="Total sales." />
            <Num {...num('final_expenses')} label="Total expenses" prefix="$" hint="All costs combined." />
            <Num {...num('ending_cash')} label="Ending cash" prefix="$" hint="Cash on hand at the end." />
            <Num {...num('cash_low_point')} label="Lowest cash" prefix="$" hint="Lowest balance during the run — shows cash crunches." />
          </div>
        </div>
        <div>
          <h3 className="section-title mb-2">Loans & debt</h3>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <Field label="Took a loan?" htmlFor="loan" hint="Any bank or investor debt during the run.">
              <select id="loan" className="input" value={form.loan_taken} onChange={(e) => set('loan_taken', e.target.value as FormState['loan_taken'])}>
                <option value="">—</option>
                <option value="yes">Yes</option>
                <option value="no">No</option>
              </select>
            </Field>
            <Num {...num('total_debt')} label="Debt remaining" prefix="$" hint="Loan balance still owed at the end." />
            <Num {...num('interest_paid')} label="Interest paid" prefix="$" hint="Total interest expense, from the income statement." />
          </div>
          <p className="hint">Loan amount, rate and term go in Step 2 → Financing.</p>
        </div>
        <div>
          <h3 className="section-title mb-2">Business</h3>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Num {...num('customer_satisfaction')} label="Customer satisfaction" suffix="%" hint="0–100 if the sim reports it." />
            <Num {...num('employees')} label="Employees at end" />
            <Num {...num('locations')} label="Locations at end" />
            <Num {...num('sim_periods_completed')} label="Periods completed" hint="Years/months the run lasted." />
          </div>
        </div>
      </Section>

      <Section
        n={4}
        title="Year-by-year snapshots (optional, recommended)"
        subtitle="Profit at the end of each sim year shows WHEN a change helped or hurt — like split times in a race."
      >
        {!showSplits ? (
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => {
              setShowSplits(true)
              if (form.checkpoints.length === 0)
                set(
                  'checkpoints',
                  DEFAULT_PERIODS.map((period) => ({ period, profit: '', net_worth: '', cash: '', revenue: '', note: '' })),
                )
            }}
          >
            + Add year-by-year numbers
          </button>
        ) : (
          <div className="space-y-2">
            <div className="hidden grid-cols-[6rem_1fr_1fr_1fr_1fr_1.5fr_2rem] gap-2 text-xs font-medium text-slate-500 md:grid">
              <span>Period</span>
              <span>Profit (cumulative)</span>
              <span>Net worth</span>
              <span>Cash</span>
              <span>Revenue</span>
              <span>What happened</span>
              <span />
            </div>
            {form.checkpoints.map((c, i) => (
              <div key={i} className="grid grid-cols-2 gap-2 rounded-xl border border-slate-200 p-2 md:grid-cols-[6rem_1fr_1fr_1fr_1fr_1.5fr_2rem] md:border-0 md:p-0 dark:border-slate-800">
                <input className="input col-span-2 md:col-span-1" aria-label={`Period ${i + 1}`} value={c.period} onChange={(e) => setCheckpoint(i, { period: e.target.value })} />
                <input className="input" inputMode="decimal" placeholder="Profit" aria-label={`${c.period} profit`} value={c.profit} onChange={(e) => setCheckpoint(i, { profit: e.target.value })} />
                <input className="input" inputMode="decimal" placeholder="Net worth" aria-label={`${c.period} net worth`} value={c.net_worth} onChange={(e) => setCheckpoint(i, { net_worth: e.target.value })} />
                <input className="input" inputMode="decimal" placeholder="Cash" aria-label={`${c.period} cash`} value={c.cash} onChange={(e) => setCheckpoint(i, { cash: e.target.value })} />
                <input className="input" inputMode="decimal" placeholder="Revenue" aria-label={`${c.period} revenue`} value={c.revenue} onChange={(e) => setCheckpoint(i, { revenue: e.target.value })} />
                <input className="input col-span-2 md:col-span-1" placeholder="e.g. opened 2nd location" aria-label={`${c.period} note`} value={c.note} onChange={(e) => setCheckpoint(i, { note: e.target.value })} />
                <button
                  type="button"
                  className="btn btn-ghost col-span-2 px-2 md:col-span-1"
                  aria-label={`Remove ${c.period}`}
                  onClick={() => set('checkpoints', form.checkpoints.filter((_, j) => j !== i))}
                >
                  ✕
                </button>
              </div>
            ))}
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() =>
                set('checkpoints', [
                  ...form.checkpoints,
                  { period: `Period ${form.checkpoints.length + 1}`, profit: '', net_worth: '', cash: '', revenue: '', note: '' },
                ])
              }
            >
              + Add period
            </button>
          </div>
        )}
      </Section>

      <Section n={5} title="Review" subtitle="Decide whether the change worked and write down what you learned while it's fresh.">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <Field label="Status" htmlFor="status" hint="Bad data = excluded from your best.">
            <select
              id="status"
              className="input"
              value={form.status === 'in_progress' ? 'completed' : form.status}
              onChange={(e) => set('status', e.target.value as AttemptStatus)}
            >
              <option value="completed">Completed</option>
              <option value="aborted">Aborted (stopped early)</option>
              <option value="bad_data">Bad data (exclude)</option>
            </select>
          </Field>
          <Field label="Verdict" htmlFor="verdict" hint="Keep = use this change from now on.">
            <select id="verdict" className="input" value={form.verdict} onChange={(e) => set('verdict', e.target.value as FormState['verdict'])}>
              <option value="">—</option>
              <option value="keep">Keep the change</option>
              <option value="discard">Discard the change</option>
              <option value="inconclusive">Inconclusive</option>
            </select>
          </Field>
          <Num {...num('minutes_spent')} label="Minutes spent" hint="Real time, for your hours total." />
        </div>
        <Field label="What happened during the run" htmlFor="run_notes" hint="Anything notable: cash ran low in Year 2, a stock-out, a staff problem…">
          <textarea id="run_notes" className="input min-h-16" value={form.run_notes} onChange={(e) => set('run_notes', e.target.value)} />
        </Field>
        <Field label="Lesson learned" htmlFor="lesson" hint="One sentence you'd tell a teammate. This is what the AI coach and future you will read.">
          <textarea id="lesson" className="input min-h-16" value={form.lesson} onChange={(e) => set('lesson', e.target.value)} />
        </Field>
        <Field label="Tags" htmlFor="tags" hint="Press Enter or comma to add. Use them to filter later.">
          <TagInput id="tags" value={form.tags} onChange={(v) => set('tags', v)} placeholder="pricing, staffing…" />
        </Field>
      </Section>

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
