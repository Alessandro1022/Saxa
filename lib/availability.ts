import { admin } from './supabase/admin'
import { addDays, computeSlots, zoned, type Hours, type Busy } from './time'

export const MAX_DAYS_AHEAD = 60

export async function getAvailability(salonId: string, serviceId: string, staffId: string, date: string) {
  const db = admin()
  const { data: salon } = await db.from('salons').select('id, timezone').eq('id', salonId).single()
  if (!salon) return null
  const { data: service } = await db
    .from('services')
    .select('id, name, duration_min, price_sek')
    .eq('id', serviceId)
    .eq('salon_id', salonId)
    .eq('active', true)
    .single()
  if (!service) return null

  let q = db.from('staff').select('id').eq('salon_id', salonId).eq('active', true)
  if (staffId !== 'any') q = q.eq('id', staffId)
  const { data: staff } = await q
  const ids = (staff ?? []).map((s) => s.id as string)
  if (!ids.length) return { salon, service, slots: [] }

  const tz = salon.timezone as string
  const dayStart = zoned(date, '00:00', tz).toISOString()
  const dayEnd = zoned(addDays(date, 1), '00:00', tz).toISOString()

  const [{ data: hours }, { data: busy }] = await Promise.all([
    db.from('staff_hours').select('staff_id, weekday, start_time, end_time').in('staff_id', ids),
    db
      .from('bookings')
      .select('staff_id, starts_at, ends_at')
      .in('staff_id', ids)
      .eq('status', 'confirmed')
      .lt('starts_at', dayEnd)
      .gt('ends_at', dayStart),
  ])

  const slots = computeSlots({
    date,
    tz,
    duration: service.duration_min as number,
    staffIds: ids,
    hours: (hours ?? []) as Hours[],
    busy: (busy ?? []) as Busy[],
  })
  return { salon, service, slots }
}
