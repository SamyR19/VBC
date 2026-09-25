import type { DecisionEntry } from '../lib/types'

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
  const baseMap = new Map((baseline ?? []).map((d) => [d.key.trim().toLowerCase(), d.value.trim()]))
  const set = (i: number, patch: Partial<DecisionEntry>) =>
    onChange(value.map((d, j) => (j === i ? { ...d, ...patch } : d)))
  const unused = suggestions.filter((s) => !value.some((d) => d.key.trim().toLowerCase() === s.toLowerCase()))

  return (
    <div className="space-y-2">
      <datalist id="decision-keys">
        {suggestions.map((s) => (
          <option key={s} value={s} />
        ))}
      </datalist>
      {value.length === 0 && (
        <p className="text-sm text-slate-500">No decisions recorded yet. Add the settings you chose in the sim.</p>
      )}
      {value.map((d, i) => {
        const k = d.key.trim().toLowerCase()
        const changed = baseline && k && (!baseMap.has(k) || baseMap.get(k) !== d.value.trim())
        return (
          <div key={i} className="flex items-center gap-2">
            <input
              className={`input flex-[2] ${changed ? 'border-amber-400 ring-1 ring-amber-300' : ''}`}
              list="decision-keys"
              placeholder="Decision (e.g. Price)"
              aria-label={`Decision ${i + 1} name`}
              value={d.key}
              onChange={(e) => set(i, { key: e.target.value })}
            />
            <input
              className={`input flex-[2] ${changed ? 'border-amber-400 ring-1 ring-amber-300' : ''}`}
              placeholder="Value"
              aria-label={`Decision ${i + 1} value`}
              value={d.value}
              onChange={(e) => set(i, { value: e.target.value })}
            />
            <button
              type="button"
              className="btn-ghost btn px-2"
              aria-label={`Remove decision ${i + 1}`}
              onClick={() => onChange(value.filter((_, j) => j !== i))}
            >
              ✕
            </button>
          </div>
        )
      })}
      <div className="flex flex-wrap gap-2 pt-1">
        <button type="button" className="btn btn-secondary" onClick={() => onChange([...value, { key: '', value: '' }])}>
          + Add decision
        </button>
        {unused.slice(0, 6).map((s) => (
          <button
            key={s}
            type="button"
            className="chip hover:bg-slate-200 dark:hover:bg-slate-700"
            onClick={() => onChange([...value, { key: s, value: '' }])}
          >
            + {s}
          </button>
        ))}
      </div>
      {baseline && <p className="hint">Highlighted rows differ from the baseline run.</p>}
    </div>
  )
}
