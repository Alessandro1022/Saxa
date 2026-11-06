import { NextResponse } from 'next/server'
import { admin } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { getAvailability } from '@/lib/availability'
import { isDate, isTime, zoned } from '@/lib/time'

export async function POST(req: Request) {
  const b = await req.json().catch(() => null)
  if (!b) return NextResponse.json({ error: 'Felaktig förfrågan' }, { status: 400 })
  const name = String(b.name ?? '').trim().slice(0, 80)
  const phone = String(b.phone ?? '').trim().slice(0, 30)
  const email = String(b.email ?? '').trim().slice(0, 120)
  const note = String(b.note ?? '').trim().slice(0, 500)
  const { salonId, serviceId, staffId, date, time } = b as Record<string, string>

  if (!name || phone.replace(/\D/g, '').length < 7)
    return NextResponse.json({ error: 'Fyll i namn och telefonnummer' }, { status: 400 })
  if (!salonId || !serviceId || !staffId || !isDate(date) || !isTime(time))
    return NextResponse.json({ error: 'Välj tjänst, frisör och tid' }, { status: 400 })

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email))
    return NextResponse.json({ error: 'Fyll i din e-post' }, { status: 400 })

  const av = await getAvailability(salonId, serviceId, staffId, date)
  const slot = av?.slots.find((s) => s.time === time)
  if (!av || !slot) return NextResponse.json({ error: 'Tiden är tyvärr inte ledig längre. Välj en annan.' }, { status: 409 })

  const chosen = staffId === 'any' ? slot.staffIds[0] : staffId
  if (!slot.staffIds.includes(chosen)) return NextResponse.json({ error: 'Tiden är inte ledig' }, { status: 409 })

  const start = zoned(date, time, av.salon.timezone as string)
  const end = new Date(start.getTime() + (av.service.duration_min as number) * 60000)

  const { data, error } = await admin()
    .from('bookings')
    .insert({
      salon_id: salonId,
      staff_id: chosen,
      service_id: serviceId,
      service_name: av.service.name,
      price_sek: av.service.price_sek,
      starts_at: start.toISOString(),
      ends_at: end.toISOString(),
      customer_name: name,
      customer_phone: phone,
      customer_email: email || null,
      note: note || null,
      source: 'online',
      customer_id: user?.id ?? null,
    })
    .select('cancel_token')
    .single()

  if (error) {
    if (error.code === '23P01')
      return NextResponse.json({ error: 'Någon hann före! Välj en annan tid.' }, { status: 409 })
    return NextResponse.json({ error: 'Något gick fel, försök igen' }, { status: 500 })
  }
  // Spara namn/telefon på kundprofilen om de saknas
  if (user) {
    const db = admin()
    const { data: c } = await db.from('customers').select('full_name, phone').eq('id', user.id).maybeSingle()
    if (!c?.full_name || !c?.phone)
      await db.from('customers').upsert({ id: user.id, full_name: c?.full_name || name, phone: c?.phone || phone })
  }
  return NextResponse.json({ token: data.cancel_token })
}
