import type { EventStatus } from '../../types/events'

// Hebrew label + badge class for every status, used by the list, the calendar and the event page
export const statusInfo: Record<EventStatus, { label: string; className: string }> = {
  Draft: { label: 'טיוטה', className: 'badge-draft' },
  Organizing: { label: 'בארגון', className: 'badge-organizing' },
  Organized: { label: 'מאורגן', className: 'badge-organized' },
  Settled: { label: 'נסגר חשבון', className: 'badge-closed' },
  Cancelled: { label: 'בוטל', className: 'badge-cancelled' },
}

export const hebrewDays = ['א׳', 'ב׳', 'ג׳', 'ד׳', 'ה׳', 'ו׳', 'ש׳']

// "yyyy-mm-dd" of a local date, for <input type="date"> and for comparing days
export function dayKey(date: Date): string {
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${date.getFullYear()}-${m}-${d}`
}

// The server wants UTC. A chosen day is sent as noon local time,
// so the time zone can never push it to the day before or after.
export function dayToUtcIso(key: string): string {
  const [y, m, d] = key.split('-').map(Number)
  return new Date(y, m - 1, d, 12).toISOString()
}

export function formatShekel(value: number | null): string {
  return value === null ? '—' : `₪${value.toLocaleString('he-IL')}`
}
