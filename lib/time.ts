import { fromZonedTime, formatInTimeZone } from 'date-fns-tz'

export const WEEKDAYS = ['Sön', 'Mån', 'Tis', 'Ons', 'Tor', 'Fre', 'Lör']
export const WEEK_ORDER = [1, 2, 3, 4, 5, 6, 0] // visa mån först

export const toMin = (t: string) => {
  const [h, m] = t.split(':').map(Number)
  return h * 60 + m
}
export const fmtMin = (m: number) =>
  `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`

export const isDate = (d: string) => /^\d{4}-\d{2}-\d{2}$/.test(d)
export const isTime = (t: string) => /^\d{2}:\d{2}$/.test(t)

export const weekdayOf = (date: string) => new Date(date + 'T12:00:00Z').getUTCDay()
export const addDays = (date: string, n: number) =>
  new Date(Date.parse(date + 'T12:00:00Z') + n * 86400000).toISOString().slice(0, 10)

export const zoned = (date: string, time: string, tz: string) => fromZonedTime(`${date}T${time}:00`, tz)
export const todayIn = (tz: string) => formatInTimeZone(new Date(), tz, 'yyyy-MM-dd')
export const fmtTz = (d: Date | string, tz: string, f: string) => formatInTimeZone(new Date(d), tz, f)

export const MONTHS = ['jan', 'feb', 'mar', 'apr', 'maj', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'dec']
export function prettyDate(date: string) {
  const [, m, d] = date.split('-').map(Number)
  return `${WEEKDAYS[weekdayOf(date)]} ${d} ${MONTHS[m - 1]}`
}

export type Hours = { staff_id: string; weekday: number; start_time: string; end_time: string }
export type Busy = { staff_id: string; starts_at: string; ends_at: string }
export type Slot = { time: string; staffIds: string[] }

export function computeSlots(o: {
  date: string
  tz: string
  duration: number
  staffIds: string[]
  hours: Hours[]
  busy: Busy[]
  step?: number
  leadMin?: number
}): Slot[] {
  const step = o.step ?? 15
  const earliest = Date.now() + (o.leadMin ?? 30) * 60000
  const wd = weekdayOf(o.date)
  const map = new Map<string, string[]>()

  for (const sid of o.staffIds) {
    const blocks = o.hours.filter((h) => h.staff_id === sid && h.weekday === wd)
    const busy = o.busy
      .filter((b) => b.staff_id === sid)
      .map((b) => [Date.parse(b.starts_at), Date.parse(b.ends_at)] as const)
    for (const bl of blocks) {
      const end = toMin(bl.end_time)
      for (let m = toMin(bl.start_time); m + o.duration <= end; m += step) {
        const t = fmtMin(m)
        const s = zoned(o.date, t, o.tz).getTime()
        const e = s + o.duration * 60000
        if (s < earliest) continue
        if (busy.some(([bs, be]) => s < be && e > bs)) continue
        const arr = map.get(t) ?? []
        if (!arr.includes(sid)) arr.push(sid)
        map.set(t, arr)
      }
    }
  }
  return [...map.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([time, staffIds]) => ({ time, staffIds }))
}
