import { admin } from './supabase/admin'
import { addDays, computeSlots, todayIn, zoned, type Hours, type Busy, type Slot } from './time'

export const MAX_DAYS_AHEAD = 60

type Opts = { days?: number; excludeBookingId?: string }

/**
 * Lediga tider för en tjänst hos en frisör (eller 'any') från `date` och `days` dagar framåt.
 * Hämtar allt i ett svep och räknar per dag. Tar hänsyn till bokningar, ledighet och framförhållning.
 */
export async function getAvailabilityRange(salonId: string, serviceId: string, staffId: string, date: string, opts: Opts = {}) {
  const days = Math.max(1, Math.min(opts.days ?? 1, 31))
  const db = admin()
  const [{ data: salon }, { data: service }] = await Promise.all([
    db.from('salons').select('*').eq('id', salonId).single(),
    db.from('services').select('id, name, duration_min, price_sek').eq('id', serviceId).eq('salon_id', salonId).eq('active', true).single(),
  ])
  if (!salon || !service) return null

  let q = db.from('staff').select('id').eq('salon_id', salonId).eq('active', true).order('sort')
  if (staffId !== 'any') q = q.eq('id', staffId)
  const { data: staff } = await q
  const ids = (staff ?? []).map((s) => s.id as string)
  const tz = salon.timezone as string
  if (date === 'today') date = todayIn(tz)
  const leadMin = (salon.lead_minutes as number | undefined) ?? 30
  if (!ids.length) return { salon, service, from: date, byDay: {} as Record<string, Slot[]> }

  const rangeStart = zoned(date, '00:00', tz).toISOString()
  const rangeEnd = zoned(addDays(date, days), '00:00', tz).toISOString()

  let bq = db
    .from('bookings')
    .select('id, staff_id, starts_at, ends_at, status, created_at')
    .in('staff_id', ids)
    .in('status', ['confirmed', 'pending'])
    .lt('starts_at', rangeEnd)
    .gt('ends_at', rangeStart)
  if (opts.excludeBookingId) bq = bq.neq('id', opts.excludeBookingId)

  const [{ data: hours }, { data: busy }, off] = await Promise.all([
    db.from('staff_hours').select('staff_id, weekday, start_time, end_time').in('staff_id', ids),
    bq,
    db.from('time_off').select('staff_id, starts_at, ends_at').eq('salon_id', salonId).lt('starts_at', rangeEnd).gt('ends_at', rangeStart),
  ])

  // Ledighet blir "upptaget" – för en frisör eller för alla (staff_id null)
  const blocked: Busy[] = []
  for (const t of (off.data ?? []) as { staff_id: string | null; starts_at: string; ends_at: string }[]) {
    for (const id of t.staff_id ? [t.staff_id] : ids) blocked.push({ staff_id: id, starts_at: t.starts_at, ends_at: t.ends_at })
  }
  // Tider som hålls för betalning räknas som upptagna i 35 min
  const staleBefore = Date.now() - 35 * 60000
  const live = ((busy ?? []) as (Busy & { status: string; created_at: string })[]).filter(
    (b) => b.status === 'confirmed' || Date.parse(b.created_at) > staleBefore
  )
  const allBusy = [...live, ...blocked]

  const byDay: Record<string, Slot[]> = {}
  for (let i = 0; i < days; i++) {
    const d = addDays(date, i)
    byDay[d] = computeSlots({
      date: d,
      tz,
      duration: service.duration_min as number,
      staffIds: ids,
      hours: (hours ?? []) as Hours[],
      busy: allBusy,
      leadMin,
    })
  }
  return { salon, service, from: date, byDay }
}

export async function getAvailability(salonId: string, serviceId: string, staffId: string, date: string, opts: Opts = {}) {
  const r = await getAvailabilityRange(salonId, serviceId, staffId, date, { ...opts, days: 1 })
  if (!r) return null
  return { salon: r.salon, service: r.service, slots: r.byDay[date] ?? [] }
}
