import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { CalendarClock, CalendarPlus, Check, Phone, X } from 'lucide-react'
import { admin } from '@/lib/supabase/admin'
import { getMe } from '@/lib/user'
import { fmtTz, prettyDate } from '@/lib/time'
import { Avatar } from '@/components/ui'
import { canChange, notifyBooking } from '@/lib/notify'
import { confirmPaid, refundIfPaid, stripe, stripeEnabled, swishDigits, swishLink } from '@/lib/stripe'
import { origin } from '@/lib/salon'

export const dynamic = 'force-dynamic'

const uuid = /^[0-9a-f-]{36}$/i

async function cancel(formData: FormData) {
  'use server'
  const token = String(formData.get('token'))
  if (!uuid.test(token)) return
  const db = admin()
  const { data: bk } = await db.from('bookings').select('id, starts_at, status, salons(*)').eq('cancel_token', token).single()
  const s = bk?.salons as unknown as { cancel_hours?: number } | undefined
  if (!bk || bk.status !== 'confirmed' || !canChange(bk.starts_at, s?.cancel_hours)) redirect(`/b/${token}`)
  await db.from('bookings').update({ status: 'cancelled' }).eq('id', bk.id)
  await refundIfPaid(bk.id)
  await notifyBooking(bk.id, 'cancelled', await origin())
  redirect(`/b/${token}`)
}

export default async function BookingPage({ params, searchParams }: { params: Promise<{ token: string }>; searchParams: Promise<{ flyttad?: string; betald?: string }> }) {
  const { token } = await params
  const { flyttad, betald } = await searchParams
  if (!uuid.test(token)) notFound()
  const [{ data: b }, me] = await Promise.all([
    admin()
      .from('bookings')
      .select('*, salons(*), staff(name, photo_url)')
      .eq('cancel_token', token)
      .single(),
    getMe(),
  ])
  if (!b) notFound()

  // Väntar på betalning: kolla direkt hos Stripe (webhooken kan vara några sekunder efter)
  let payUrl: string | null = null
  if (b.status === 'pending' && b.stripe_session_id && stripeEnabled()) {
    try {
      const session = await stripe().checkout.sessions.retrieve(b.stripe_session_id)
      if (await confirmPaid(session)) {
        await notifyBooking(b.id, 'new', await origin())
        b.status = 'confirmed'
        b.payment_status = 'paid'
        b.paid_sek = Math.round((session.amount_total ?? 0) / 100)
      } else if (session.status === 'open') payUrl = session.url
    } catch {}
  }

  const salon = b.salons as unknown as { name: string; slug: string; address: string | null; timezone: string; logo_url: string | null; phone: string | null; cancel_hours?: number; swish_number?: string | null }
  const staff = b.staff as unknown as { name: string; photo_url: string | null }
  const date = fmtTz(b.starts_at, salon.timezone, 'yyyy-MM-dd')
  const pending = b.status === 'pending'
  const cancelled = b.status === 'cancelled' || (pending && !payUrl)
  const past = Date.parse(b.starts_at) < Date.now()
  const swishNo = swishDigits(salon.swish_number)
  const awaiting = b.status === 'confirmed' && b.payment_status === 'awaiting' && !!swishNo && !!b.due_sek
  const swishMsg = `Saxa ${String(b.customer_name).split(' ')[0]} ${fmtTz(b.starts_at, salon.timezone, 'd.M HH.mm')}`
  const changeable = b.status === 'confirmed' && canChange(b.starts_at, salon.cancel_hours)

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col px-5 py-12">
      <div className="rise text-center">
        <div
          className={`mx-auto flex h-24 w-24 items-center justify-center rounded-full ${cancelled ? 'bg-red-500/15 text-red-400' : 'text-ongold'}`}
          style={cancelled ? undefined : { background: 'linear-gradient(160deg,#f3dfa9,#c99d4a)', boxShadow: '0 20px 50px -18px rgb(210 171 92 / .9)' }}
        >
          {cancelled ? <X size={40} /> : <Check size={44} strokeWidth={3} />}
        </div>
        <h1 className="mt-6 text-[30px] font-bold tracking-tight">{pending && payUrl ? 'Nästan klart' : cancelled ? (pending ? 'Betalningen hann gå ut' : 'Avbokad') : flyttad ? 'Tiden är flyttad!' : 'Du är bokad!'}</h1>
        <p className="mt-1 text-mute">
          {pending && payUrl
            ? 'Betala för att säkra din tid.'
            : cancelled
              ? 'Tiden är nu ledig för andra.'
              : awaiting
                ? 'Tiden är din – swisha förskottet för att slutföra.'
                : b.payment_status === 'paid'
                ? `Betalt ${b.paid_sek ?? ''} kr${betald ? ' – tack!' : ''} · Vi ses, ${b.customer_name.split(' ')[0]} ✂️`
                : `Vi ses, ${b.customer_name.split(' ')[0]} ✂️`}
        </p>
      </div>

      <div className="card rise rise-1 mt-8 p-5">
        <div className="flex items-center gap-3">
          <Avatar name={staff?.name ?? '?'} src={staff?.photo_url} size={52} />
          <div className="flex-1">
            <div className="font-semibold">{b.service_name}</div>
            <div className="text-sm text-mute">med {staff?.name}</div>
          </div>
          {b.price_sek != null && <div className="font-bold text-gold">{b.price_sek} kr</div>}
        </div>
        <div className="mt-5 grid grid-cols-2 gap-2">
          <div className="rounded-[20px] p-3.5" style={{ background: 'color-mix(in srgb, rgb(var(--fg)) 4.5%, rgb(var(--ink)))' }}>
            <div className="text-xs text-mute">Datum</div>
            <div className="font-semibold">{prettyDate(date)}</div>
          </div>
          <div className="rounded-[20px] p-3.5" style={{ background: 'color-mix(in srgb, rgb(var(--fg)) 4.5%, rgb(var(--ink)))' }}>
            <div className="text-xs text-mute">Tid</div>
            <div className="font-semibold">{fmtTz(b.starts_at, salon.timezone, 'HH:mm')}–{fmtTz(b.ends_at, salon.timezone, 'HH:mm')}</div>
          </div>
        </div>
        <div className="mt-2 rounded-[20px] p-3.5" style={{ background: 'color-mix(in srgb, rgb(var(--fg)) 4.5%, rgb(var(--ink)))' }}>
          <div className="text-xs text-mute">Salong</div>
          <div className="font-semibold">{salon.name}</div>
          {salon.address && <div className="text-sm text-mute">{salon.address}</div>}
        </div>
      </div>

      <div className="rise rise-2 mt-6 grid gap-3">
        {pending && payUrl && (
          <a href={payUrl} className="btn-gold !py-4 text-base">Betala och boka</a>
        )}
        {awaiting && (
          <div className="card p-5 text-center">
            <div className="text-sm text-mute">{salon.name} tar {b.due_sek} kr i förskott</div>
            <a href={swishLink(swishNo, b.due_sek, swishMsg)} className="btn-gold mt-3 w-full !py-4 text-base">Betala {b.due_sek} kr med Swish</a>
            <p className="mt-3 text-xs text-mute">
              Öppnas inte Swish? Swisha {b.due_sek} kr till <b className="text-fg">{swishNo}</b> och skriv ”{swishMsg}”. Salongen bekräftar när betalningen kommit in.
            </p>
          </div>
        )}
        {cancelled && b.payment_status === 'paid' && !b.stripe_payment_intent && (
          <p className="text-center text-sm text-mute">Kontakta salongen för återbetalning av {b.paid_sek} kr.</p>
        )}
        {b.payment_status === 'refunded' && <p className="text-center text-sm text-mute">Betalningen är återbetald.</p>}
        {!cancelled && !pending && !past && (
          <a href={`/api/booking-ics/${token}`} className={awaiting ? 'btn-soft' : 'btn-gold'}><CalendarPlus size={18} /> Lägg i kalendern</a>
        )}
        {changeable ? (
          <div className="grid grid-cols-2 gap-2">
            <Link href={`/${salon.slug}?omboka=${token}#boka`} className="btn-soft"><CalendarClock size={17} /> Flytta tid</Link>
            <form action={cancel}>
              <input type="hidden" name="token" value={token} />
              <button className="btn-soft w-full text-red-400">Avboka</button>
            </form>
          </div>
        ) : (
          b.status === 'confirmed' &&
          !past && (
            <p className="text-center text-sm text-mute">
              Ändringar går att göra senast {salon.cancel_hours ?? 2} h innan.
              {salon.phone && (
                <a href={`tel:${salon.phone}`} className="ml-1 inline-flex items-center gap-1 font-medium text-gold"><Phone size={13} /> Ring salongen</a>
              )}
            </p>
          )
        )}
        {me ? (
          <Link href="/me" className="btn-soft">Mina bokningar</Link>
        ) : (
          <Link href="/login?mode=up" className="card block p-4 text-center text-sm">
            <span className="font-semibold text-gold">Skapa konto</span> <span className="text-mute">och samla alla dina bokningar på ett ställe</span>
          </Link>
        )}
        <Link href={`/${salon.slug}`} className="text-center text-sm text-mute hover:text-fg">{cancelled ? 'Boka ny tid' : 'Tillbaka till salongen'}</Link>
      </div>
    </main>
  )
}
