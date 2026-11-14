'use server'

import { revalidatePath, revalidateTag } from 'next/cache'
import { redirect } from 'next/navigation'
import { requireSalon, RESERVED, slugify } from '@/lib/salon'
import { isDate, isTime, zoned } from '@/lib/time'
import { notifyBooking, notifyPaid } from '@/lib/notify'
import { origin } from '@/lib/salon'

const s = (f: FormData, k: string) => String(f.get(k) ?? '').trim()
const n = (f: FormData, k: string) => {
  const v = s(f, k)
  return v === '' ? null : Number(v)
}
const back = (path: string, msg: string) => redirect(`${path}?e=${encodeURIComponent(msg)}`)

// ---------- Bokningar ----------
export async function addManualBooking(f: FormData) {
  const { supabase, salon } = await requireSalon()
  const date = s(f, 'date')
  const time = s(f, 'time')
  const name = s(f, 'name')
  if (!isDate(date) || !isTime(time) || !name) back('/dashboard', 'Fyll i datum, tid och namn')
  const { data: svc } = await supabase.from('services').select('id, name, duration_min, price_sek').eq('id', s(f, 'service_id')).single()
  if (!svc) back('/dashboard', 'Välj tjänst')
  const start = zoned(date, time, salon.timezone)
  const { error } = await supabase.from('bookings').insert({
    salon_id: salon.id,
    staff_id: s(f, 'staff_id'),
    service_id: svc!.id,
    service_name: svc!.name,
    price_sek: svc!.price_sek,
    starts_at: start.toISOString(),
    ends_at: new Date(start.getTime() + svc!.duration_min * 60000).toISOString(),
    customer_name: name,
    customer_phone: s(f, 'phone') || null,
    note: s(f, 'note') || null,
    source: 'manual',
  })
  if (error) back('/dashboard', error.code === '23P01' ? 'Krockar med en annan bokning' : 'Kunde inte spara')
  revalidatePath('/dashboard')
  redirect(`/dashboard?ok=1&d=${date}`)
}

export async function cancelBooking(f: FormData) {
  const { supabase, salon } = await requireSalon()
  const id = s(f, 'id')
  await supabase.from('bookings').update({ status: 'cancelled' }).eq('id', id).eq('salon_id', salon.id)
  await notifyBooking(id, 'cancelled', await origin())
  revalidatePath('/dashboard')
}

// Markera utebliven / ångra
export async function toggleNoShow(f: FormData) {
  const { supabase, salon } = await requireSalon()
  const next = s(f, 'status') === 'no_show' ? 'confirmed' : 'no_show'
  const { error } = await supabase.from('bookings').update({ status: next }).eq('id', s(f, 'id')).eq('salon_id', salon.id)
  if (error) back('/dashboard', 'Kör 004_system.sql i Supabase för att kunna markera uteblivna')
  revalidatePath('/dashboard')
  revalidatePath('/dashboard/customers')
}

// ---------- Ledighet / blockerad tid ----------
export async function addTimeOff(f: FormData) {
  const { supabase, salon } = await requireSalon()
  const d1 = s(f, 'from_date'), t1 = s(f, 'from_time') || '00:00'
  const d2 = s(f, 'to_date') || d1, t2 = s(f, 'to_time') || '23:59'
  if (!isDate(d1) || !isDate(d2) || !isTime(t1) || !isTime(t2)) back('/dashboard', 'Fyll i från och till')
  const start = zoned(d1, t1, salon.timezone)
  const end = zoned(d2, t2, salon.timezone)
  if (end <= start) back('/dashboard', 'Sluttiden måste vara efter starttiden')
  const staffId = s(f, 'staff_id')
  const { error } = await supabase.from('time_off').insert({
    salon_id: salon.id,
    staff_id: staffId && staffId !== 'all' ? staffId : null,
    starts_at: start.toISOString(),
    ends_at: end.toISOString(),
    reason: s(f, 'reason') || null,
  })
  if (error) back('/dashboard', error.code === '42P01' || error.code === 'PGRST205' ? 'Kör 004_system.sql i Supabase först' : 'Kunde inte spara')
  revalidatePath('/dashboard')
  redirect(`/dashboard?ok=2&d=${d1}`)
}

export async function deleteTimeOff(f: FormData) {
  const { supabase, salon } = await requireSalon()
  await supabase.from('time_off').delete().eq('id', s(f, 'id')).eq('salon_id', salon.id)
  revalidatePath('/dashboard')
}

// ---------- Tjänster ----------
export async function saveService(f: FormData) {
  const { supabase, salon } = await requireSalon()
  const row = {
    salon_id: salon.id,
    name: s(f, 'name'),
    description: s(f, 'description') || null,
    duration_min: n(f, 'duration_min') ?? 30,
    price_sek: n(f, 'price_sek'),
    active: f.get('active') === 'on',
    sort: n(f, 'sort') ?? 0,
  }
  if (!row.name) back('/dashboard/services', 'Namn saknas')
  const id = s(f, 'id')
  const { error } = id
    ? await supabase.from('services').update(row).eq('id', id)
    : await supabase.from('services').insert(row)
  if (error) back('/dashboard/services', 'Kunde inte spara (längd 5–480 min)')
  revalidateTag('public')
  revalidatePath('/dashboard/services')
}

export async function deleteService(f: FormData) {
  const { supabase } = await requireSalon()
  await supabase.from('services').delete().eq('id', s(f, 'id'))
  revalidateTag('public')
  revalidatePath('/dashboard/services')
}

// ---------- Personal ----------
export async function saveStaff(f: FormData) {
  const { supabase, salon } = await requireSalon()
  const row = {
    salon_id: salon.id,
    name: s(f, 'name'),
    title: s(f, 'title') || null,
    bio: s(f, 'bio') || null,
    photo_url: s(f, 'photo_url') || null,
    active: f.get('active') === 'on',
  }
  if (!row.name) back('/dashboard/staff', 'Namn saknas')
  const id = s(f, 'id')
  if (id) {
    await supabase.from('staff').update(row).eq('id', id)
  } else {
    const { data } = await supabase.from('staff').insert(row).select('id').single()
    if (data) {
      await supabase.from('staff_hours').insert(
        [1, 2, 3, 4, 5].map((d) => ({ salon_id: salon.id, staff_id: data.id, weekday: d, start_time: '10:00', end_time: '18:00' }))
      )
    }
  }
  revalidateTag('public')
  revalidatePath('/dashboard/staff')
}

export async function deleteStaff(f: FormData) {
  const { supabase } = await requireSalon()
  await supabase.from('staff').delete().eq('id', s(f, 'id'))
  revalidateTag('public')
  revalidatePath('/dashboard/staff')
}

export async function saveHours(f: FormData) {
  const { supabase, salon } = await requireSalon()
  const staffId = s(f, 'staff_id')
  const rows: { salon_id: string; staff_id: string; weekday: number; start_time: string; end_time: string }[] = []
  for (let d = 0; d < 7; d++) {
    if (f.get(`open_${d}`) !== 'on') continue
    const a = s(f, `start_${d}`)
    const b = s(f, `end_${d}`)
    if (isTime(a) && isTime(b) && b > a) rows.push({ salon_id: salon.id, staff_id: staffId, weekday: d, start_time: a, end_time: b })
  }
  await supabase.from('staff_hours').delete().eq('staff_id', staffId)
  if (rows.length) await supabase.from('staff_hours').insert(rows)
  revalidateTag('public')
  revalidatePath('/dashboard/staff')
}

// ---------- Salong ----------
export async function saveSalon(f: FormData) {
  const { supabase, salon } = await requireSalon()
  const slug = slugify(s(f, 'slug'))
  if (slug.length < 3 || RESERVED.includes(slug)) back('/dashboard/settings', 'Ogiltig länk')
  const base = {
    name: s(f, 'name') || salon.name,
    slug,
    description: s(f, 'description') || null,
    address: s(f, 'address') || null,
    city: s(f, 'city') || null,
    phone: s(f, 'phone') || null,
    instagram: s(f, 'instagram').replace('@', '') || null,
    logo_url: s(f, 'logo_url') || null,
    cover_url: s(f, 'cover_url') || null,
  }
  const extra = {
    cancel_hours: Math.max(0, Math.min(72, n(f, 'cancel_hours') ?? 2)),
    lead_minutes: Math.max(0, Math.min(1440, n(f, 'lead_minutes') ?? 30)),
    notify_email: s(f, 'notify_email') || null,
  }
  let { error } = await supabase.from('salons').update({ ...base, ...extra }).eq('id', salon.id)
  // Utan 004_system.sql finns inte de nya kolumnerna – spara resten ändå
  if (error?.code === '42703' || error?.code === 'PGRST204') ({ error } = await supabase.from('salons').update(base).eq('id', salon.id))
  if (error) back('/dashboard/settings', error.code === '23505' ? 'Länken är redan tagen' : 'Kunde inte spara')
  revalidateTag('public')
  revalidatePath('/dashboard', 'layout')
  redirect('/dashboard/settings?ok=1')
}

// ---------- Betalning (Swish) ----------
export async function savePayments(f: FormData) {
  const { supabase, salon } = await requireSalon()
  const mode = ['none', 'deposit', 'full'].includes(s(f, 'pay_mode')) ? s(f, 'pay_mode') : 'none'
  const swish = s(f, 'swish_number').replace(/\D/g, '')
  if (swish && swish.length < 8) back('/dashboard/settings', 'Swish-numret ser fel ut')
  if (mode !== 'none' && !swish) back('/dashboard/settings', 'Fyll i ditt Swish-nummer för att ta betalt')
  const { error } = await supabase
    .from('salons')
    .update({ swish_number: swish || null, pay_mode: mode, deposit_sek: Math.max(5, Math.min(5000, n(f, 'deposit_sek') ?? 100)) })
    .eq('id', salon.id)
  if (error) back('/dashboard/settings', 'Kör 006_swish.sql i Supabase först')
  revalidateTag('public')
  redirect('/dashboard/settings?ok=1#betalning')
}

// Frisören bekräftar att Swish kommit in (eller ångrar)
export async function markPaid(f: FormData) {
  const { supabase, salon } = await requireSalon()
  const paid = s(f, 'paid') === '1'
  await supabase
    .from('bookings')
    .update(paid ? { payment_status: 'awaiting', paid_sek: null } : { payment_status: 'paid', paid_sek: n(f, 'due') })
    .eq('id', s(f, 'id'))
    .eq('salon_id', salon.id)
  if (!paid) await notifyPaid(s(f, 'id'), await origin())
  revalidatePath('/dashboard')
}

export async function signOut() {
  const { supabase } = await requireSalon()
  await supabase.auth.signOut()
  redirect('/login')
}
