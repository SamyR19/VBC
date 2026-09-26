import { useState } from 'react'
import { useLocation } from 'react-router-dom'
import { guideFor } from '../guides'

function Steps() {
  const guide = guideFor(useLocation().pathname)
  return (
    <div className="space-y-4 text-sm">
      <p className="text-slate-600 dark:text-slate-400">{guide.intro}</p>
      <ol className="space-y-3">
        {guide.steps.map((s, i) => (
          <li key={s.title} className="flex gap-3">
            <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-100 text-xs font-bold text-brand-700 dark:bg-slate-800 dark:text-brand-100">
              {i + 1}
            </span>
            <div>
              <div className="font-medium text-slate-900 dark:text-slate-100">{s.title}</div>
              <div className="mt-0.5 text-slate-600 dark:text-slate-400">{s.body}</div>
            </div>
          </li>
        ))}
      </ol>
      {guide.tips && (
        <div className="rounded-xl bg-slate-100 p-3 text-xs text-slate-600 dark:bg-slate-800 dark:text-slate-300">
          {guide.tips.map((t, i) => (
            <p key={i} className={i ? 'mt-1.5' : ''}>
              💡 {t}
            </p>
          ))}
        </div>
      )}
    </div>
  )
}

/** Desktop: left column. */
export function GuideSidebar({ onCollapse }: { onCollapse: () => void }) {
  const guide = guideFor(useLocation().pathname)
  return (
    <div className="card p-4">
      <div className="mb-3 flex items-start justify-between gap-2">
        <div>
          <div className="section-title">How to</div>
          <h2 className="font-semibold">{guide.title}</h2>
        </div>
        <button className="btn btn-ghost px-2 py-1 text-xs" onClick={onCollapse} aria-label="Hide guide">
          ⟨ Hide
        </button>
      </div>
      <Steps />
    </div>
  )
}

/** Phones/tablets: collapsible panel at the top of each page. */
export function GuideInline() {
  const guide = guideFor(useLocation().pathname)
  const [open, setOpen] = useState(false)
  return (
    <div className="mb-4 rounded-2xl border border-brand-100 bg-brand-50 dark:border-slate-800 dark:bg-slate-900">
      <button className="flex w-full items-center justify-between gap-2 px-4 py-2.5 text-left text-sm" onClick={() => setOpen(!open)} aria-expanded={open}>
        <span>
          <span className="font-semibold">How to:</span> {guide.title}
        </span>
        <span aria-hidden>{open ? '▴' : '▾'}</span>
      </button>
      {open && (
        <div className="border-t border-brand-100 px-4 py-3 dark:border-slate-800">
          <Steps />
        </div>
      )}
    </div>
  )
}
