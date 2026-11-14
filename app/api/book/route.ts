import { NextResponse } from 'next/server'
import { admin } from '@/lib/supabase/admin'
import { getAuth } from '@/lib/auth'
import { getAvailability } from '@/lib/availability'
import { fmtTz, isDate, isTime, prettyDate, zoned } from '@/lib/time'
import { notifyBooking } from '@/lib/notify'
import { origin } from '@/lib/salon'
import { amountFor, feePercent, payCfg, releaseStalePending, stripe } from '@/lib/stripe'

export async function POST(req: Request) {
  const b = await req.json().catch(() => null)
  if (!b) return NextResponse.json({ error: 'Felaktig förfrågan' }, { status: 400 })
  const name = String(b.name ?? '').trim().slice(0, 80)
  const phone = String(b.phone ?? '').trim().slice(0, 30)
  const email = String(b.email ?? '').trim().slice(0, 120)
  const note = String(b.note ?? '').trim().slice(0, 500)
  const { salonId, serviceId, staffId, date, time } = b as Record<string, string>

  if (!name || phone.replace(/\D/g, '').length < 7) return NextResponse.json({ error: 'Fyll i namn och telefonnummer' }, { status: 400 })
  if (!salonId || !serviceId || !staffId || !isDate(date) || !isTime(time))
    return NextResponse.json({ error: 'Välj tjänst, frisör och tid' }, { status: 400 })

  const user = await getAuth()
  if (!user && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return NextResponse.json({ error: 'Fyll i din e-post' }, { status: 400 })

  await releaseStalePending()
  const av = await getAvailability(salonId, serviceId, staffId, date)
  const slot = av?.slots.find((s) => s.time === time)
  if (!av || !slot) return NextResponse.json({ error: 'Tiden är tyvärr inte ledig längre. Välj en annan.' }, { status: 409 })

  const chosen = staffId === 'any' ? slot.staffIds[0] : staffId
  if (!slot.staffIds.includes(chosen)) return NextResponse.json({ error: 'Tiden är inte ledig' }, { status: 409 })

  const tz = av.salon.timezone as string
  const start = zoned(date, time, tz)
  const end = new Date(start.getTime() + (av.service.duration_min as number) * 60000)
  const cfg = payCfg(av.salon)
  const amount = amountFor(cfg, av.service.price_sek as number | null)
  const mustPay = amount > 0 && cfg.method === 'stripe'
  const viaSwish = amount > 0 && cfg.method === 'swish'

  const db = admin()
  const { data, error } = await db
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
      ...(mustPay ? { status: 'pending', payment_status: 'pending' } : {}),
      ...(viaSwish ? { payment_status: 'awaiting', due_sek: amount } : {}),
    })
    .select('id, cancel_token')
    .single()

  if (error) {
    if (error.code === '23P01') return NextResponse.json({ error: 'Någon hann före! Välj en annan tid.' }, { status: 409 })
    return NextResponse.json({ error: 'Något gick fel, försök igen' }, { status: 500 })
  }

  // Spara namn/telefon på kundprofilen om de saknas
  if (user) {
    const { data: c } = await db.from('customers').select('full_name, phone').eq('id', user.id).maybeSingle()
    if (!c?.full_name || !c?.phone) await db.from('customers').upsert({ id: user.id, full_name: c?.full_name || name, phone: c?.phone || phone })
  }

  const site = await origin()
  if (!mustPay) {
    await notifyBooking(data.id, 'new', site)
    return NextResponse.json({ token: data.cancel_token })
  }

  // Betalning: skapa Stripe Checkout – pengarna går direkt till salongens Stripe-konto
  try {
    const fee = Math.round(amount * 100 * (feePercent() / 100))
    const session = await stripe().checkout.sessions.create({
      mode: 'payment',
      locale: 'sv',
      customer_email: email || user?.email || undefined,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: 'sek',
            unit_amount: amount * 100,
            product_data: {
              name: `${av.service.name} – ${av.salon.name}`,
              description: `${cfg.mode === 'full' ? 'Betalning' : 'Handpenning'} · ${prettyDate(date)} kl ${fmtTz(start, tz, 'HH:mm')}`,
            },
          },
        },
      ],
      payment_intent_data: {
        transfer_data: { destination: av.salon.stripe_account_id as string },
        ...(fee > 0 ? { application_fee_amount: fee } : {}),
        metadata: { booking_id: data.id },
      },
      metadata: { booking_id: data.id },
      expires_at: Math.floor(Date.now() / 1000) + 31 * 60,
      success_url: `${site}/b/${data.cancel_token}?betald=1`,
      cancel_url: `${site}/api/checkout/cancel?token=${data.cancel_token}`,
    })
    await db.from('bookings').update({ stripe_session_id: session.id }).eq('id', data.id)
    return NextResponse.json({ token: data.cancel_token, checkoutUrl: session.url })
  } catch (e) {
    console.error('checkout', e)
    await db.from('bookings').update({ status: 'cancelled', payment_status: null }).eq('id', data.id)
    return NextResponse.json({ error: 'Betalningen kunde inte startas. Försök igen.' }, { status: 502 })
  }
}
