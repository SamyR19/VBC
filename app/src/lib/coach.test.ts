import { describe, expect, it } from 'vitest'
import { buildOpenAIRequest, COACH_SCHEMA, isCompetitionOpen, parseOpenAIResponse } from '../../supabase/functions/_shared/coach'
import { buildCoachContext } from './coachContext'
import { makeAttempt } from './testing'
import type { Round, Team } from './types'

const team = { id: 't', name: 'Lincoln VBC', business_type: 'Smoothie shop', competition_mode: 'auto', ai_in_rounds: false } as Team
const round = { id: 'r', label: 'Practice', kind: 'practice', opens_at: null, closes_at: null, ranking_metric: 'profit', metric_verified: false } as unknown as Round

describe('buildOpenAIRequest', () => {
  it('uses strict structured output and trims history', () => {
    const turns = Array.from({ length: 20 }, (_, i) => ({ role: i % 2 ? ('assistant' as const) : ('user' as const), content: `m${i}` }))
    const body = buildOpenAIRequest('gpt-5-mini', 'ctx', turns)
    expect(body.text.format).toMatchObject({ type: 'json_schema', strict: true, name: 'coach_reply' })
    expect(body.input[0]).toMatchObject({ role: 'developer' })
    expect(body.input).toHaveLength(13) // context + last 12 turns
    expect(body.input.at(-1)).toEqual({ role: 'assistant', content: 'm19' })
  })

  it('schema is strict-mode compatible (every property required, no extras)', () => {
    const check = (s: { type?: string; properties?: Record<string, unknown>; required?: readonly string[]; additionalProperties?: boolean; items?: unknown }) => {
      if (s.type === 'object') {
        expect(s.additionalProperties).toBe(false)
        expect([...(s.required ?? [])].sort()).toEqual(Object.keys(s.properties ?? {}).sort())
        for (const p of Object.values(s.properties ?? {})) check(p as never)
      }
      if (s.type === 'array') check(s.items as never)
    }
    check(COACH_SCHEMA as never)
  })
})

describe('parseOpenAIResponse', () => {
  const reply = { reply: 'Try pricing.', ideas: [{ idea: 'Raise price', category: 'Pricing', variable: 'Main price', from_value: '$5', to_value: '$5.50', expected_effect: 'more profit', rationale: 'untested', priority: 2, effort: 'quick' }], follow_ups: ['Why?'] }
  it('reads output message text', () => {
    const r = parseOpenAIResponse({ output: [{ type: 'reasoning' }, { type: 'message', content: [{ type: 'output_text', text: JSON.stringify(reply) }] }] })
    expect(r.ideas[0].to_value).toBe('$5.50')
    expect(r.follow_ups).toEqual(['Why?'])
  })
  it('handles refusals, errors and truncation', () => {
    expect(parseOpenAIResponse({ output: [{ type: 'message', content: [{ type: 'refusal', refusal: 'No.' }] }] }).reply).toBe('No.')
    expect(() => parseOpenAIResponse({ error: { message: 'bad key' } })).toThrow('bad key')
    expect(() => parseOpenAIResponse({ output: [], incomplete_details: { reason: 'max_output_tokens' } })).toThrow(/cut off/)
  })
})

describe('isCompetitionOpen', () => {
  const r1 = { kind: 'round1', opens_at: '2026-10-13T14:00:00Z', closes_at: '2026-10-23T21:00:00Z' }
  it('locks only during open competition windows in auto mode', () => {
    expect(isCompetitionOpen({ competition_mode: 'auto' }, [r1], [], new Date('2026-10-15T00:00:00Z'))).toBe(true)
    expect(isCompetitionOpen({ competition_mode: 'auto' }, [r1], [], new Date('2026-09-26T00:00:00Z'))).toBe(false)
    expect(isCompetitionOpen({ competition_mode: 'off' }, [r1], [], new Date('2026-10-15T00:00:00Z'))).toBe(false)
    expect(isCompetitionOpen({ competition_mode: 'on' }, [], [], new Date())).toBe(true)
  })
})

describe('buildCoachContext', () => {
  it('summarises PB, effects, runs and ideas without member names', () => {
    const base = makeAttempt({ round_id: 'r', final_profit: 1000, decisions: [{ key: 'Main price', value: '5', group: 'Pricing' }], operator_id: 'm1' })
    const next = makeAttempt({ round_id: 'r', parent_attempt_id: base.id, final_profit: 1600, hypothesis: 'raise price', decisions: [{ key: 'Main price', value: '5.5', group: 'Pricing' }], lesson: 'price up works' })
    const ctx = buildCoachContext({
      team,
      round,
      attempts: [base, next],
      backlog: [{ id: 'b', team_id: 't', idea: 'Try ads', variable: 'Marketing budget', category: 'Marketing', from_value: '$500', to_value: '$800', expected_effect: null, rationale: null, effort: null, source: 'me', priority: 2, status: 'queued', tested_attempt_id: null, created_at: '' }],
      snapshots: [],
      page: { label: 'Home', details: '' },
      now: new Date('2026-09-26T00:00:00Z'),
    })
    expect(ctx).toContain('PERSONAL BEST (PB): "raise price"')
    expect(ctx).toContain('[Pricing] Main price = 5.5')
    expect(ctx).toMatch(/Main price: 1 clean run\(s\), avg \+\$600/)
    expect(ctx).toContain('Main price: 5 → 5.5')
    expect(ctx).toContain('lesson: price up works')
    expect(ctx).toContain('Try ads (Marketing budget: $500 → $800)')
    expect(ctx).not.toContain('Lincoln')
  })
})
