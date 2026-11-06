import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { CalendarPlus, Check, X } from 'lucide-react'
import { admin } from '@/lib/supabase/admin'
import { getMe } from '@/lib/user'
import { fmtTz, prettyDate } from '@/lib/time'
import { Avatar } from '@/components/ui'

export const dynamic = 'force-dynamic'

const uuid = /^[0-9a-f-]{36}$/i

async function cancel(formData: FormData) {
  'use server'
  const token = String(formData.get('token'))
  if (!uuid.test(token)) return
  await admin().from('bookings').update({ status: 'cancelled' }).eq('cancel_token', token).gt('starts_at', new Date().toISOString())
  redirect(`/b/${token}`)
}

export default async function BookingPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  if (!uuid.test(token)) notFound()
  const [{ data: b }, me] = await Promise.all([
    admin()
      .from('bookings')
      .select('starts_at, ends_at, service_name, price_sek, customer_name, status, salons(name, slug, address, timezone, logo_url), staff(name, photo_url)')
      .eq('cancel_token', token)
      .single(),
    getMe(),
  ])
  if (!b) notFound()

  const salon = b.salons as unknown as { name: string; slug: string; address: string | null; timezone: string; logo_url: string | null }
  const staff = b.staff as unknown as { name: string; photo_url: string | null }
  const date = fmtTz(b.starts_at, salon.timezone, 'yyyy-MM-dd')
  const cancelled = b.status === 'cancelled'
  const past = Date.parse(b.starts_at) < Date.now()

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col px-5 py-12">
      <div className="rise text-center">
        <div
          className={`mx-auto flex h-24 w-24 items-center justify-center rounded-full ${cancelled ? 'bg-red-500/15 text-red-400' : 'text-ongold'}`}
          style={cancelled ? undefined : { background: 'linear-gradient(160deg,#f3dfa9,#c99d4a)', boxShadow: '0 20px 50px -18px rgb(210 171 92 / .9)' }}
        >
          {cancelled ? <X size={40} /> : <Check size={44} strokeWidth={3} />}
        </div>
        <h1 className="mt-6 text-[30px] font-bold tracking-tight">{cancelled ? 'Avbokad' : 'Du är bokad!'}</h1>
        <p className="mt-1 text-mute">{cancelled ? 'Tiden är nu ledig för andra.' : `Vi ses, ${b.customer_name.split(' ')[0]} ✂️`}</p>
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
          <div className="rounded-[20px] p-3.5" style={{ background: 'rgb(var(--fg) / .045)' }}>
            <div className="text-xs text-mute">Datum</div>
            <div className="font-semibold">{prettyDate(date)}</div>
          </div>
          <div className="rounded-[20px] p-3.5" style={{ background: 'rgb(var(--fg) / .045)' }}>
            <div className="text-xs text-mute">Tid</div>
            <div className="font-semibold">{fmtTz(b.starts_at, salon.timezone, 'HH:mm')}–{fmtTz(b.ends_at, salon.timezone, 'HH:mm')}</div>
          </div>
        </div>
        <div className="mt-2 rounded-[20px] p-3.5" style={{ background: 'rgb(var(--fg) / .045)' }}>
          <div className="text-xs text-mute">Salong</div>
          <div className="font-semibold">{salon.name}</div>
          {salon.address && <div className="text-sm text-mute">{salon.address}</div>}
        </div>
      </div>

      <div className="rise rise-2 mt-6 grid gap-3">
        {!cancelled && !past && (
          <>
            <a href={`/api/booking-ics/${token}`} className="btn-gold"><CalendarPlus size={18} /> Lägg i kalendern</a>
            <form action={cancel}>
              <input type="hidden" name="token" value={token} />
              <button className="btn w-full text-red-400 hover:bg-red-500/10">Avboka</button>
            </form>
          </>
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
