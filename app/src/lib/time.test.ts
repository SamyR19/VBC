import { describe, expect, it } from 'vitest'
import { etInputToIso, formatDuration, isoToEtInput } from './time'
import { SEASON_2026_27 } from './season'

describe('Eastern Time conversion', () => {
  it('handles EDT and EST', () => {
    expect(etInputToIso('2026-10-13T10:00')).toBe('2026-10-13T14:00:00.000Z')
    expect(etInputToIso('2027-01-12T10:00')).toBe('2027-01-12T15:00:00.000Z')
  })
  it('round-trips', () => {
    for (const iso of ['2026-10-23T21:00:00.000Z', '2027-01-22T22:00:00.000Z', '2026-11-01T08:30:00.000Z', '2027-03-14T12:00:00.000Z'])
      expect(etInputToIso(isoToEtInput(iso))).toBe(iso)
  })
  it('rejects junk', () => {
    expect(etInputToIso('')).toBeNull()
    expect(etInputToIso('tomorrow')).toBeNull()
  })
  it('seeded 2026-27 windows match 10:00 a.m. / 5:00 p.m. ET', () => {
    const r1 = SEASON_2026_27.find((r) => r.kind === 'round1')!
    const r2 = SEASON_2026_27.find((r) => r.kind === 'round2')!
    expect(isoToEtInput(r1.opens_at)).toBe('2026-10-13T10:00')
    expect(isoToEtInput(r1.closes_at)).toBe('2026-10-23T17:00')
    expect(isoToEtInput(r2.opens_at)).toBe('2027-01-12T10:00')
    expect(isoToEtInput(r2.closes_at)).toBe('2027-01-22T17:00')
    for (const w of [...r1.windows, ...r2.windows]) {
      expect(isoToEtInput(w.opens_at).slice(11)).toBe('20:30')
      expect(isoToEtInput(w.closes_at).slice(11)).toBe('17:00')
    }
  })
})

describe('formatDuration', () => {
  it('formats', () => {
    expect(formatDuration(0)).toBe('0m')
    expect(formatDuration(90 * 60000)).toBe('1h 30m')
    expect(formatDuration((2 * 1440 + 180) * 60000)).toBe('2d 3h')
  })
})
