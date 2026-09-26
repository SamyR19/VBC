import { useState } from 'react'
import { DECISION_TEMPLATE, TEMPLATE_KEYS } from '../lib/season'
import type { DecisionEntry } from '../lib/types'

const norm = (s: string) => s.trim().toLowerCase()

/**
 * Decisions grouped by area (Financing, Staffing, Pricing…). Each template field is optional;
 * blank fields are not saved. Anything else goes under "Other" as free key/value rows.
 */
export function DecisionEditor({
  value,
  onChange,
  suggestions,
  baseline,
}: {
  value: DecisionEntry[]
  onChange: (v: DecisionEntry[]) => void
  suggestions: string[]
  baseline?: DecisionEntry[]
}) {
  const valueOf = (key: string) => value.find((d) => norm(d.key) === norm(key))?.value ?? ''
  const baseOf = (key: string) => baseline?.find((d) => norm(d.key) === norm(key))?.value
  const isChanged = (key: string, v: string) => {
    if (!baseline) return false
    const b = baseOf(key)
    return (b ?? '').trim() !== v.trim()
  }

  const setField = (group: string, key: string, v: string) => {
    const i = value.findIndex((d) => norm(d.key) === norm(key))
    if (!v.trim()) {
      onChange(i >= 0 ? value.filter((_, j) => j !== i) : value)
      return
    }
    if (i >= 0) onChange(value.map((d, j) => (j === i ? { ...d, value: v, group } : d)))
    else onChange([...value, { key, value: v, group }])
  }

  const custom = value.map((d, i) => ({ d, i })).filter(({ d }) => !TEMPLATE_KEYS.has(norm(d.key)) || d.key === '')
  const setCustom = (i: number, patch: Partial<DecisionEntry>) =>
    onChange(value.map((d, j) => (j === i ? { ...d, ...patch, group: 'Other' } : d)))

  const filledIn = (group: string) =>
    DECISION_TEMPLATE.find((g) => g.group === group)!.fields.filter((f) => valueOf(f.key).trim()).length
  const changedIn = (group: string) =>
    DECISION_TEMPLATE.find((g) => g.group === group)!.fields.filter((f) => isChanged(f.key, valueOf(f.key))).length

  const [open, setOpen] = useState<Set<string>>(
    () => new Set(DECISION_TEMPLATE.filter((g) => g.fields.some((f) => valueOf(f.key))).map((g) => g.group)),
  )
  const toggle = (g: string) => setOpen((s) => new Set(s.has(g) ? [...s].filter((x) => x !== g) : [...s, g]))
  const customSuggestions = suggestions.filter((s) => !TEMPLATE_KEYS.has(norm(s)))

  return (
    <div className="space-y-2">
      {DECISION_TEMPLATE.map((g) => {
        const isOpen = open.has(g.group)
        const filled = filledIn(g.group)
        const changed = changedIn(g.group)
        return (
          <div key={g.group} className="rounded-xl border border-slate-200 dark:border-slate-800">
            <button
              type="button"
              className="flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left"
              aria-expanded={isOpen}
              onClick={() => toggle(g.group)}
            >
              <span className="font-medium">{g.group}</span>
              <span className="flex items-center gap-2 text-xs text-slate-500">
                {changed > 0 && <span className="chip bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">{changed} changed</span>}
                {filled > 0 ? `${filled}/${g.fields.length} filled` : 'empty'}
                <span aria-hidden>{isOpen ? '▴' : '▾'}</span>
              </span>
            </button>
            {isOpen && (
              <div className="space-y-3 border-t border-slate-200 px-3 pt-2 pb-3 dark:border-slate-800">
                <p className="text-xs text-slate-500 dark:text-slate-400">{g.why}</p>
                <div className="grid gap-3 sm:grid-cols-2">
                  {g.fields.map((f) => {
                    const v = valueOf(f.key)
                    const changedHere = isChanged(f.key, v)
                    const base = baseOf(f.key)
                    const id = `dec-${f.key.replace(/\W+/g, '-')}`
                    return (
                      <div key={f.key}>
                        <label htmlFor={id} className="label flex items-center justify-between gap-2">
                          <span>{f.key}</span>
                          {changedHere && (
                            <span className="text-xs font-normal text-amber-600">was: {base?.trim() ? base : '(blank)'}</span>
                          )}
                        </label>
                        <input
                          id={id}
                          className={`input ${changedHere ? 'border-amber-400 ring-1 ring-amber-300' : ''}`}
                          placeholder={f.placeholder}
                          value={v}
                          onChange={(e) => setField(g.group, f.key, e.target.value)}
                        />
                        <p className="hint">{f.hint}</p>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        )
      })}

      <div className="rounded-xl border border-slate-200 p-3 dark:border-slate-800">
        <div className="mb-2 flex items-center justify-between">
          <span className="font-medium">Other decisions</span>
          <span className="text-xs text-slate-500">anything the sim asks that isn’t listed above</span>
        </div>
        <datalist id="decision-keys">
          {customSuggestions.map((s) => (
            <option key={s} value={s} />
          ))}
        </datalist>
        <div className="space-y-2">
          {custom.map(({ d, i }, n) => {
            const changedHere = d.key.trim() !== '' && isChanged(d.key, d.value)
            return (
              <div key={i} className="flex items-center gap-2">
                <input
                  className={`input flex-1 ${changedHere ? 'border-amber-400' : ''}`}
                  list="decision-keys"
                  placeholder="Decision name"
                  aria-label={`Other decision ${n + 1} name`}
                  value={d.key}
                  onChange={(e) => setCustom(i, { key: e.target.value })}
                />
                <input
                  className={`input flex-1 ${changedHere ? 'border-amber-400' : ''}`}
                  placeholder="Value"
                  aria-label={`Other decision ${n + 1} value`}
                  value={d.value}
                  onChange={(e) => setCustom(i, { value: e.target.value })}
                />
                <button
                  type="button"
                  className="btn btn-ghost px-2"
                  aria-label={`Remove other decision ${n + 1}`}
                  onClick={() => onChange(value.filter((_, j) => j !== i))}
                >
                  ✕
                </button>
              </div>
            )
          })}
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => onChange([...value, { key: '', value: '', group: 'Other' }])}
          >
            + Add another decision
          </button>
        </div>
      </div>
      {baseline && <p className="hint">Amber fields differ from the baseline run. Aim for exactly one.</p>}
    </div>
  )
}
