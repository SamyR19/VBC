import { useState, type ReactNode } from 'react'
import type { Metric } from '../lib/types'
import { formatDelta } from '../lib/metrics'

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <section className={`card ${className}`}>{children}</section>
}

export function Field({
  label,
  hint,
  children,
  htmlFor,
}: {
  label: string
  hint?: ReactNode
  children: ReactNode
  htmlFor?: string
}) {
  return (
    <div>
      <label className="label" htmlFor={htmlFor}>
        {label}
      </label>
      {children}
      {hint && <p className="hint">{hint}</p>}
    </div>
  )
}

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  )
}

export function Stat({
  label,
  value,
  sub,
  tone = 'default',
}: {
  label: string
  value: ReactNode
  sub?: ReactNode
  tone?: 'default' | 'good' | 'bad'
}) {
  const toneClass =
    tone === 'good'
      ? 'text-emerald-600 dark:text-emerald-400'
      : tone === 'bad'
        ? 'text-rose-600 dark:text-rose-400'
        : ''
  return (
    <div className="card">
      <div className="section-title">{label}</div>
      <div className={`mt-1 text-2xl font-bold tabular-nums ${toneClass}`}>{value}</div>
      {sub && <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">{sub}</div>}
    </div>
  )
}

export function Delta({ value, metric }: { value: number | null; metric: Metric }) {
  if (value == null) return <span className="text-slate-400">—</span>
  const cls =
    value > 0
      ? 'text-emerald-600 dark:text-emerald-400'
      : value < 0
        ? 'text-rose-600 dark:text-rose-400'
        : 'text-slate-500'
  return <span className={`font-semibold tabular-nums ${cls}`}>{formatDelta(value, metric)}</span>
}

export function Empty({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 p-8 text-center dark:border-slate-700">
      <p className="font-medium">{title}</p>
      {children && <div className="mt-2 text-sm text-slate-500 dark:text-slate-400">{children}</div>}
    </div>
  )
}

export function StatusChip({ status }: { status: string }) {
  const map: Record<string, string> = {
    completed: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300',
    in_progress: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300',
    aborted: 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
    bad_data: 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300',
    keep: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300',
    discard: 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300',
    inconclusive: 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  }
  const label: Record<string, string> = { in_progress: 'planned', bad_data: 'bad data' }
  return (
    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${map[status] ?? 'chip'}`}>
      {label[status] ?? status}
    </span>
  )
}

export function PbBadge() {
  return (
    <span className="inline-flex rounded-full bg-amber-400 px-2 py-0.5 text-xs font-bold text-amber-950">PB</span>
  )
}

/** Comma/Enter separated tag entry. */
export function TagInput({
  value,
  onChange,
  placeholder,
  id,
}: {
  value: string[]
  onChange: (v: string[]) => void
  placeholder?: string
  id?: string
}) {
  const [draft, setDraft] = useState('')
  const commit = () => {
    const parts = draft
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
    if (parts.length) onChange([...new Set([...value, ...parts])])
    setDraft('')
  }
  return (
    <div className="input flex flex-wrap items-center gap-1.5">
      {value.map((t) => (
        <span key={t} className="chip">
          {t}
          <button
            type="button"
            aria-label={`Remove ${t}`}
            className="text-slate-400 hover:text-rose-600"
            onClick={() => onChange(value.filter((x) => x !== t))}
          >
            ×
          </button>
        </span>
      ))}
      <input
        id={id}
        className="min-w-24 flex-1 bg-transparent outline-none"
        value={draft}
        placeholder={value.length ? '' : placeholder}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault()
            commit()
          } else if (e.key === 'Backspace' && !draft && value.length) {
            onChange(value.slice(0, -1))
          }
        }}
        onBlur={commit}
      />
    </div>
  )
}

export function Spinner() {
  return <div className="p-8 text-center text-sm text-slate-500">Loading…</div>
}

export function ErrorNote({ error }: { error: unknown }) {
  if (!error) return null
  const msg = error instanceof Error ? error.message : typeof error === 'object' && error && 'message' in error ? String((error as { message: unknown }).message) : String(error)
  return (
    <p role="alert" className="rounded-xl bg-rose-50 p-3 text-sm text-rose-700 dark:bg-rose-950 dark:text-rose-300">
      {msg}
    </p>
  )
}

/** Parse a user-typed number, tolerating $ , and spaces. Empty -> null. */
export function parseNum(s: string): number | null {
  const cleaned = s.replace(/[$,\s]/g, '')
  if (cleaned === '' || cleaned === '-') return null
  const n = Number(cleaned)
  return Number.isFinite(n) ? n : null
}

export function numToInput(n: number | null | undefined): string {
  return n == null ? '' : String(n)
}
