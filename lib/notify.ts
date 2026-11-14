import { admin } from './supabase/admin'
import { fmtTz, prettyDate } from './time'
import { bookingRef } from './ref'
import { customerTokens, salonTokens, sendPush } from './push'

/**
 * Mejl via Resend (resend.com). Aktiveras när RESEND_API_KEY finns i Vercel.
 * Avsändare: EMAIL_FROM, t.ex. "Saxa <bokning@dindomän.se>" (domänen måste verifieras i Resend).
 * Utan nyckel hoppas mejlen tyst över – bokningen fungerar ändå.
 */
async function send(to: string | null | undefined, subject: string, html: string) {
  const key = process.env.RESEND_API_KEY
  if (!key || !to) return
  try {
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: process.env.EMAIL_FROM ?? 'Saxa <onboarding@resend.dev>', to, subject, html }),
    })
  } catch (e) {
    console.error('mail', e)
  }
}

const wrap = (title: string, body: string, cta?: { href: string; label: string }) => `
<div style="font-family:-apple-system,Segoe UI,Helvetica,Arial,sans-serif;background:#f6f5f2;padding:32px 16px">
  <div style="max-width:460px;margin:0 auto;background:#fff;border-radius:24px;padding:28px;border:1px solid #eee">
    <div style="font-weight:800;font-size:20px;letter-spacing:-.02em;color:#141109">Saxa</div>
    <h1 style="font-size:24px;margin:20px 0 8px;color:#141109">${title}</h1>
    <div style="font-size:15px;line-height:1.55;color:#444">${body}</div>
    ${cta ? `<a href="${cta.href}" style="display:inline-block;margin-top:22px;background:#d2ab5c;color:#141109;text-decoration:none;font-weight:700;padding:14px 22px;border-radius:999px">${cta.label}</a>` : ''}
  </div>
</div>`

type Kind = 'new' | 'moved' | 'cancelled'

/** Mejla kunden och salongen om en bokning. Kastar aldrig fel. */
export async function notifyBooking(bookingId: string, kind: Kind, origin: string) {
  try {
    const db = admin()
    const { data: b } = await db
      .from('bookings')
      .select('id, salon_id, customer_id, starts_at, service_name, customer_name, customer_phone, customer_email, cancel_token, salons(*), staff(name)')
      .eq('id', bookingId)
      .single()
    if (!b) return
    const salon = b.salons as unknown as { name: string; timezone: string; address: string | null; owner_id: string | null; notify_email?: string | null }
    const staff = b.staff as unknown as { name: string } | null
    const when = `${prettyDate(fmtTz(b.starts_at, salon.timezone, 'yyyy-MM-dd'))} kl ${fmtTz(b.starts_at, salon.timezone, 'HH:mm')}`
    const link = `${origin}/b/${b.cancel_token}`
    const details = `Bokningsnr <b>${bookingRef(b.id)}</b><br><b>${b.service_name}</b> med ${staff?.name ?? 'frisören'}<br>${when}<br>${salon.name}${salon.address ? `, ${salon.address}` : ''}`

    // Push till appen (kundens "ny bokning"-notis skickas när telefonen visar bekräftelsen)
    const shortWhen = `${prettyDate(fmtTz(b.starts_at, salon.timezone, 'yyyy-MM-dd'))} kl ${fmtTz(b.starts_at, salon.timezone, 'HH:mm')}`
    const ref = bookingRef(b.id)
    await Promise.all([
      kind === 'new'
        ? null
        : sendPush(await customerTokens(b.id, b.customer_id), {
            title: kind === 'moved' ? 'Din tid är flyttad' : 'Din bokning är avbokad',
            body: `${b.service_name} · ${shortWhen} hos ${salon.name} · ${ref}`,
            url: link,
          }),
      sendPush(await salonTokens(b.salon_id), {
        title: { new: 'Ny bokning 🎉', moved: 'Bokning flyttad', cancelled: 'Avbokning' }[kind],
        body: `${b.customer_name} · ${b.service_name} · ${shortWhen} · ${ref}`,
        url: `${origin}/dashboard?d=${fmtTz(b.starts_at, salon.timezone, 'yyyy-MM-dd')}`,
      }),
    ])

    const customerTitle = { new: 'Du är bokad! ✂️', moved: 'Din tid är flyttad', cancelled: 'Din bokning är avbokad' }[kind]
    await send(b.customer_email, `${customerTitle} – ${salon.name}`, wrap(customerTitle, details, kind === 'cancelled' ? undefined : { href: link, label: 'Visa eller ändra bokning' }))

    let to = salon.notify_email ?? null
    if (!to && salon.owner_id) {
      const { data } = await db.auth.admin.getUserById(salon.owner_id)
      to = data.user?.email ?? null
    }
    const salonTitle = { new: 'Ny bokning', moved: 'Bokning flyttad', cancelled: 'Avbokning' }[kind]
    await send(
      to,
      `${salonTitle}: ${b.customer_name} ${fmtTz(b.starts_at, salon.timezone, 'd/M HH:mm')}`,
      wrap(salonTitle, `${b.customer_name}${b.customer_phone ? ` · ${b.customer_phone}` : ''}<br><br>${details}`, { href: `${origin}/dashboard`, label: 'Öppna panelen' })
    )
  } catch (e) {
    console.error('notifyBooking', e)
  }
}

/** Får kunden fortfarande avboka/omboka själv? */
export function canChange(startsAt: string, cancelHours: number | null | undefined) {
  return Date.parse(startsAt) - Date.now() > (cancelHours ?? 2) * 3600_000
}

/** Push till kunden när salongen bekräftat Swish-betalningen. */
export async function notifyPaid(bookingId: string, origin: string) {
  try {
    const { data: b } = await admin().from('bookings').select('id, customer_id, paid_sek, cancel_token, salons(name)').eq('id', bookingId).single()
    if (!b) return
    await sendPush(await customerTokens(b.id, b.customer_id), {
      title: 'Betalning bekräftad ✓',
      body: `${(b.salons as unknown as { name: string }).name} har fått dina ${b.paid_sek} kr · ${bookingRef(b.id)}`,
      url: `${origin}/b/${b.cancel_token}`,
    })
  } catch (e) {
    console.error('notifyPaid', e)
  }
}
