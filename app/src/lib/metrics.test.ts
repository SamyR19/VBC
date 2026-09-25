import { describe, expect, it } from 'vitest'
import {
  bestBefore,
  changedKeys,
  competitionActive,
  defaultRound,
  diffDecisions,
  nextEvent,
  personalBest,
  progressSeries,
  roundPhase,
} from './metrics'
import { makeAttempt } from './testing'
import type { Round, Team } from './types'

describe('personalBest', () => {
  it('uses the configured metric and ignores non-completed or bad-data runs', () => {
    const a = makeAttempt({ final_profit: 100, final_net_worth: 900 })
    const b = makeAttempt({ final_profit: 300, final_net_worth: 200 })
    const c = makeAttempt({ final_profit: 999, status: 'bad_data' })
    const d = makeAttempt({ final_profit: 5000, status: 'in_progress' })
    const e = makeAttempt({ final_profit: 4000, status: 'aborted' })
    expect(personalBest([a, b, c, d, e], 'profit')?.id).toBe(b.id)
    expect(personalBest([a, b, c, d, e], 'net_worth')?.id).toBe(a.id)
    expect(personalBest([a, b], 'points')).toBeNull()
  })

  it('keeps the earliest run on ties', () => {
    const a = makeAttempt({ final_profit: 100 })
    const b = makeAttempt({ final_profit: 100 })
    expect(personalBest([b, a], 'profit')?.id).toBe(a.id)
  })

  it('handles negative scores', () => {
    const a = makeAttempt({ final_profit: -500 })
    const b = makeAttempt({ final_profit: -100 })
    expect(personalBest([a, b], 'profit')?.id).toBe(b.id)
  })
})

describe('bestBefore / progressSeries', () => {
  it('finds the best earlier run and a running best', () => {
    const a = makeAttempt({ final_profit: 100 })
    const b = makeAttempt({ final_profit: 50 })
    const c = makeAttempt({ final_profit: 200 })
    expect(bestBefore([a, b, c], c, 'profit')?.id).toBe(a.id)
    expect(bestBefore([a, b, c], a, 'profit')).toBeNull()
    expect(progressSeries([c, a, b], 'profit').map((p) => [p.score, p.best])).toEqual([
      [100, 100],
      [50, 100],
      [200, 200],
    ])
  })
})

describe('diffDecisions', () => {
  it('reports changed, added, removed and same keys (case/space-insensitive keys)', () => {
    const before = [
      { key: 'Price', value: '10' },
      { key: 'Wage', value: '15' },
      { key: 'Loan', value: '0' },
    ]
    const after = [
      { key: 'price ', value: '12' },
      { key: 'Wage', value: ' 15' },
      { key: 'Ads', value: 'social' },
      { key: '', value: 'ignored' },
    ]
    const rows = diffDecisions(before, after)
    expect(rows.map((r) => [r.key, r.kind])).toEqual([
      ['price', 'changed'],
      ['Wage', 'same'],
      ['Ads', 'added'],
      ['Loan', 'removed'],
    ])
    expect(changedKeys(before, after)).toEqual(['price', 'Ads', 'Loan'])
  })
})

const round = (p: Partial<Round>): Round => ({
  id: 'r',
  team_id: 't',
  season: '2026-27',
  kind: 'round1',
  label: 'Round 1',
  opens_at: '2026-10-13T14:00:00Z',
  closes_at: '2026-10-23T21:00:00Z',
  ranking_metric: 'profit',
  metric_verified: false,
  est_qualifying_cutoff: null,
  notes: null,
  created_at: '',
  ...p,
})

describe('round timing', () => {
  const practice = round({ id: 'p', kind: 'practice', label: 'Practice', opens_at: null, closes_at: null })
  const r1 = round({ id: 'r1' })
  const r2 = round({ id: 'r2', kind: 'round2', opens_at: '2027-01-12T15:00:00Z', closes_at: '2027-01-22T22:00:00Z' })
  const team = { competition_mode: 'auto' } as Team

  it('computes phases', () => {
    expect(roundPhase(r1, new Date('2026-10-13T13:59:00Z'))).toBe('upcoming')
    expect(roundPhase(r1, new Date('2026-10-13T14:00:00Z'))).toBe('open')
    expect(roundPhase(r1, new Date('2026-10-23T21:00:01Z'))).toBe('closed')
    expect(roundPhase(practice, new Date())).toBe('always')
  })

  it('defaults to the open round, else practice', () => {
    expect(defaultRound([practice, r1, r2], new Date('2026-10-15T00:00:00Z'))?.id).toBe('r1')
    expect(defaultRound([practice, r1, r2], new Date('2026-09-25T00:00:00Z'))?.id).toBe('p')
  })

  it('finds the next deadline', () => {
    expect(nextEvent([practice, r1, r2], new Date('2026-09-25T00:00:00Z'))).toMatchObject({ kind: 'opens', at: r1.opens_at })
    expect(nextEvent([practice, r1, r2], new Date('2026-10-20T00:00:00Z'))).toMatchObject({ kind: 'closes', at: r1.closes_at })
    expect(nextEvent([practice, r1, r2], new Date('2026-11-01T00:00:00Z'))).toMatchObject({ kind: 'opens', at: r2.opens_at })
    expect(nextEvent([practice, r1, r2], new Date('2027-02-01T00:00:00Z'))).toBeNull()
  })

  it('turns competition mode on only while a round or window is open (auto)', () => {
    expect(competitionActive(team, [practice, r1], [], new Date('2026-10-15T00:00:00Z'))).toBe(true)
    expect(competitionActive(team, [practice, r1], [], new Date('2026-09-25T00:00:00Z'))).toBe(false)
    expect(competitionActive({ competition_mode: 'on' } as Team, [], [], new Date())).toBe(true)
    expect(competitionActive({ competition_mode: 'off' } as Team, [r1], [], new Date('2026-10-15T00:00:00Z'))).toBe(false)
  })
})
