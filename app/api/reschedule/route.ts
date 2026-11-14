import { NextResponse } from 'next/server'
import { admin } from '@/lib/supabase/admin'
import { getAvailability } from '@/lib/availability'
import { canChange, notifyBooking } from '@/lib/notify'
import { origin } from '@/lib/salon'
import { isDate, isTime, zoned } from '@/lib/time'

// Flytta en bokning till en ny tid (via bokningens hemliga länk)
export async function POST(req: Request) {
  const b = await req.json().catch(() => null)
  const { token, staffId, date, time } = (b ?? {}) as Record<string, string>
  if (!/^[0-9a-f-]{36}$/i.test(token ?? '') || !isDate(date) || !isTime(time))
    return NextResponse.json({ error: 'Felaktig förfrågan' }, { status: 400 })

  const db = admin()
  const { data: bk } = await db.from('bookings').select('id, salon_id, service_id, staff_id, starts_at, status, salons(*)').eq('cancel_token', token).single()
  if (!bk || bk.status !== 'confirmed' || !bk.service_id) return NextResponse.json({ error: 'Bokningen kan inte flyttas' }, { status: 400 })
  const salon = bk.salons as unknown as { cancel_hours?: number }
  if (!canChange(bk.starts_at, salon.cancel_hours))
    return NextResponse.json({ error: `Det går bara att flytta senast ${salon.cancel_hours ?? 2} h innan. Ring salongen.` }, { status: 400 })

  const want = staffId || bk.staff_id
  const av = await getAvailability(bk.salon_id, bk.service_id, want, date, { excludeBookingId: bk.id })
  const slot = av?.slots.find((s) => s.time === time)
  if (!av || !slot) return NextResponse.json({ error: 'Tiden är inte ledig längre' }, { status: 409 })
  const chosen = want === 'any' ? slot.staffIds[0] : want
  const start = zoned(date, time, av.salon.timezone as string)
  const end = new Date(start.getTime() + (av.service.duration_min as number) * 60000)

  const { error } = await db.from('bookings').update({ staff_id: chosen, starts_at: start.toISOString(), ends_at: end.toISOString() }).eq('id', bk.id)
  if (error) return NextResponse.json({ error: error.code === '23P01' ? 'Någon hann före – välj en annan tid' : 'Kunde inte flytta' }, { status: 409 })
  await notifyBooking(bk.id, 'moved', await origin())
  return NextResponse.json({ token })
}
