import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { Card, Empty, ErrorNote, PageHeader, Spinner } from '../components/ui'
import { newId } from '../lib/store/store'
import type { BacklogItem } from '../lib/types'
import { useTeam } from '../state/app'
import { useMutations, useRows } from '../state/data'

const PRIORITY = [
  { v: 2, label: 'High' },
  { v: 1, label: 'Medium' },
  { v: 0, label: 'Low' },
]

export function Backlog() {
  const { canEdit } = useTeam()
  const { data: items = [], isLoading } = useRows('backlog')
  const { insert, update, remove } = useMutations('backlog')
  const [idea, setIdea] = useState('')
  const [variable, setVariable] = useState('')
  const [priority, setPriority] = useState(1)
  const [show, setShow] = useState<'queued' | 'done'>('queued')
  const [error, setError] = useState<unknown>(null)

  if (isLoading) return <Spinner />

  const add = async (e: FormEvent) => {
    e.preventDefault()
    if (!idea.trim()) return
    try {
      await insert.mutateAsync({
        id: newId(),
        idea: idea.trim(),
        variable: variable.trim() || null,
        priority,
        status: 'queued',
        tested_attempt_id: null,
      })
      setIdea('')
      setVariable('')
    } catch (err) {
      setError(err)
    }
  }

  const list = items
    .filter((b) => (show === 'queued' ? b.status === 'queued' : b.status !== 'queued'))
    .sort((a, b) => b.priority - a.priority || a.created_at.localeCompare(b.created_at))

  const setStatus = (b: BacklogItem, status: BacklogItem['status']) => update.mutate({ id: b.id, patch: { status } })

  return (
    <div className="space-y-4">
      <PageHeader title="Experiment ideas" subtitle="Queue single-variable tests so no run is wasted deciding what to try." />

      {canEdit && (
        <Card>
          <form onSubmit={add} className="grid gap-2 sm:grid-cols-[1fr_12rem_8rem_auto]">
            <input
              className="input"
              placeholder="Idea, e.g. hire 1 fewer employee in year 1"
              aria-label="Idea"
              value={idea}
              onChange={(e) => setIdea(e.target.value)}
            />
            <input
              className="input"
              placeholder="Variable (optional)"
              aria-label="Variable"
              value={variable}
              onChange={(e) => setVariable(e.target.value)}
            />
            <select className="input" aria-label="Priority" value={priority} onChange={(e) => setPriority(Number(e.target.value))}>
              {PRIORITY.map((p) => (
                <option key={p.v} value={p.v}>
                  {p.label}
                </option>
              ))}
            </select>
            <button className="btn btn-primary" disabled={!idea.trim()}>
              Add
            </button>
          </form>
          <ErrorNote error={error} />
        </Card>
      )}

      <div className="flex gap-1">
        {(['queued', 'done'] as const).map((s) => (
          <button
            key={s}
            className={`btn ${show === s ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setShow(s)}
          >
            {s === 'queued' ? `Queued (${items.filter((b) => b.status === 'queued').length})` : 'Tested / dropped'}
          </button>
        ))}
      </div>

      {list.length === 0 ? (
        <Empty title={show === 'queued' ? 'No queued ideas' : 'Nothing tested yet'}>
          After every run, write down the next thing you want to test.
        </Empty>
      ) : (
        <ul className="space-y-2">
          {list.map((b) => (
            <li key={b.id} className="card flex flex-wrap items-center gap-3">
              <div className="min-w-0 flex-1">
                <div className="font-medium">{b.idea}</div>
                <div className="mt-0.5 flex flex-wrap gap-2 text-xs text-slate-500">
                  <span>{PRIORITY.find((p) => p.v === b.priority)?.label ?? 'Low'} priority</span>
                  {b.variable && <span className="chip">{b.variable}</span>}
                  {b.status !== 'queued' && <span className="chip">{b.status}</span>}
                  {b.tested_attempt_id && (
                    <Link className="underline" to={`/attempts/${b.tested_attempt_id}`}>
                      see result
                    </Link>
                  )}
                </div>
              </div>
              {canEdit && (
                <div className="flex gap-1">
                  {b.status === 'queued' ? (
                    <>
                      <Link className="btn btn-primary" to={`/attempts/new?backlog=${b.id}`}>
                        Test it
                      </Link>
                      <button className="btn btn-ghost" onClick={() => setStatus(b, 'dropped')}>
                        Drop
                      </button>
                    </>
                  ) : (
                    <button className="btn btn-ghost" onClick={() => setStatus(b, 'queued')}>
                      Re-queue
                    </button>
                  )}
                  <button
                    className="btn btn-ghost"
                    aria-label="Delete idea"
                    onClick={() => confirm('Delete this idea?') && remove.mutate(b.id)}
                  >
                    ✕
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
