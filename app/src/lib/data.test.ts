import { describe, expect, it } from 'vitest'
import { attemptsToCsv, emptyIdea, exportBackup, importBackup, seedSeason } from './data'
import { LocalStore } from './store/local'
import { newId, nowIso } from './store/store'
import { makeAttempt, MemoryKV } from './testing'
import type { Team } from './types'

const team = (name: string): Team => ({
  id: newId(),
  name,
  track: 'entrepreneurship',
  business_type: null,
  competition_mode: 'auto',
  ai_in_rounds: false,
  decision_keys: [],
  join_code: null,
  created_at: nowIso(),
})

async function setup() {
  const store = new LocalStore(new MemoryKV())
  const t = await store.createTeam(team('A'))
  await seedSeason(store, t.id)
  return { store, t }
}

describe('seedSeason', () => {
  it('creates four rounds and six mini-challenge windows', async () => {
    const { store, t } = await setup()
    expect((await store.list('rounds', t.id)).map((r) => r.kind).sort()).toEqual(['icdc', 'practice', 'round1', 'round2'])
    expect(await store.list('round_windows', t.id)).toHaveLength(6)
  })
})

describe('backup round-trip', () => {
  it('imports into another team with fresh ids, remapped references and merged rounds', async () => {
    const { store, t } = await setup()
    const rounds = await store.list('rounds', t.id)
    const r1 = rounds.find((r) => r.kind === 'round1')!
    const member = await store.insert('members', { id: newId(), team_id: t.id, user_id: null, display_name: 'Sam', role: 'student' })
    const idea = await store.insert('backlog', { id: newId(), team_id: t.id, ...emptyIdea(), idea: 'x', priority: 0, status: 'queued', tested_attempt_id: null })
    const base = await store.insert('attempts', makeAttempt({ id: newId(), team_id: t.id, round_id: r1.id, final_profit: 10, operator_id: member.id }))
    const next = await store.insert('attempts', makeAttempt({ id: newId(), team_id: t.id, round_id: r1.id, parent_attempt_id: base.id, backlog_id: idea.id }))
    await store.update('backlog', idea.id, { tested_attempt_id: next.id, status: 'tested' })

    const backup = await exportBackup(store, t)
    const t2 = await store.createTeam(team('B'))
    await seedSeason(store, t2.id)
    await importBackup(store, t2.id, backup)

    const r1b = (await store.list('rounds', t2.id)).filter((r) => r.kind === 'round1')
    expect(r1b).toHaveLength(1) // merged, not duplicated
    const attempts = await store.list('attempts', t2.id)
    expect(attempts).toHaveLength(2)
    const ids = new Set(attempts.map((a) => a.id))
    expect(ids.has(base.id)).toBe(false)
    const child = attempts.find((a) => a.parent_attempt_id)!
    expect(ids.has(child.parent_attempt_id!)).toBe(true)
    expect(child.round_id).toBe(r1b[0].id)
    const [m2] = await store.list('members', t2.id)
    expect(attempts.find((a) => a.operator_id)!.operator_id).toBe(m2.id)
    const [b2] = await store.list('backlog', t2.id)
    expect(b2.tested_attempt_id).toBe(child.id)
    expect(child.backlog_id).toBe(b2.id)
    // Source team untouched
    expect(await store.list('attempts', t.id)).toHaveLength(2)
  })
})

describe('attemptsToCsv', () => {
  it('escapes commas, quotes and newlines', () => {
    const csv = attemptsToCsv(
      [makeAttempt({ hypothesis: 'raise "price", then\nwait', decisions: [{ key: 'Price', value: '12' }], tags: ['a', 'b'] })],
      [],
      () => 'Sam',
    )
    const [header, row] = csv.split(/\n(?=[^\n]*$)|\n/, 2)
    expect(header.startsWith('started_at,round,status')).toBe(true)
    expect(csv).toContain('"raise ""price"", then\nwait"')
    expect(csv).toContain('Price=12')
    expect(csv).toContain('a; b')
    expect(row).toBeDefined()
  })
})
