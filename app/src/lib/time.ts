export const ET = 'America/New_York'

const etFormatter = new Intl.DateTimeFormat('en-US', {
  timeZone: ET,
  weekday: 'short',
  month: 'short',
  day: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
  timeZoneName: 'short',
})

export function formatET(iso: string | null | undefined): string {
  if (!iso) return '—'
  return etFormatter.format(new Date(iso))
}

export function formatLocal(iso: string | null | undefined): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

// Offset (minutes) of a time zone from UTC at a given instant.
function tzOffsetMinutes(date: Date, timeZone: string): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).formatToParts(date)
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value)
  const asUtc = Date.UTC(get('year'), get('month') - 1, get('day'), get('hour'), get('minute'), get('second'))
  return (asUtc - date.getTime()) / 60000
}

/** Convert a `YYYY-MM-DDTHH:mm` wall-clock time in Eastern Time to a UTC ISO string. */
export function etInputToIso(value: string): string | null {
  if (!value) return null
  const m = value.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/)
  if (!m) return null
  const naive = Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5])
  let guess = naive - tzOffsetMinutes(new Date(naive), ET) * 60000
  // Second pass settles DST boundaries.
  guess = naive - tzOffsetMinutes(new Date(guess), ET) * 60000
  return new Date(guess).toISOString()
}

/** Convert a UTC ISO string to a `YYYY-MM-DDTHH:mm` value in Eastern Time (for datetime-local inputs). */
export function isoToEtInput(iso: string | null | undefined): string {
  if (!iso) return ''
  const d = new Date(iso)
  const shifted = new Date(d.getTime() + tzOffsetMinutes(d, ET) * 60000)
  return shifted.toISOString().slice(0, 16)
}

export function formatDuration(ms: number): string {
  const totalMin = Math.max(0, Math.floor(ms / 60000))
  const d = Math.floor(totalMin / 1440)
  const h = Math.floor((totalMin % 1440) / 60)
  const m = totalMin % 60
  if (d > 0) return `${d}d ${h}h`
  if (h > 0) return `${h}h ${m}m`
  return `${m}m`
}

export function isSameLocalDay(a: string, b: Date): boolean {
  const d = new Date(a)
  return d.getFullYear() === b.getFullYear() && d.getMonth() === b.getMonth() && d.getDate() === b.getDate()
}

export function todayISODate(): string {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}
