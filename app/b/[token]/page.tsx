import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { admin } from '@/lib/supabase/admin'
import { fmtTz, prettyDate } from '@/lib/time'

export const dynamic = 'force-dynamic'

const uuid = /^[0-9a-f-]{36}$/i

async function cancel(formData: FormData) {
  'use server'
  const token = String(formData.get('token'))
  if (!uuid.test(token)) return
  await admin()
    .from('bookings')
    .update({ status: 'cancelled' })
    .eq('cancel_token', token)
    .gt('starts_at', new Date().toISOString())
  redirect(`/b/${token}`)
}

export default async function BookingPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  if (!uuid.test(token)) notFound()
  const { data: b } = await admin()
    .from('bookings')
    .select('starts_at, ends_at, service_name, price_sek, customer_name, status, salons(name, slug, address, timezone), staff(name)')
    .eq('cancel_token', token)
    .single()
  if (!b) notFound()

  const salon = b.salons as unknown as { name: string; slug: string; address: string | null; timezone: string }
  const staff = b.staff as unknown as { name: string }
  const date = fmtTz(b.starts_at, salon.timezone, 'yyyy-MM-dd')
  const cancelled = b.status === 'cancelled'
  const past = Date.parse(b.starts_at) < Date.now()

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col px-5 py-12">
      <div className="rise text-center">
        <div
          className={`mx-auto flex h-20 w-20 items-center justify-center rounded-full text-4xl ${
            cancelled ? 'bg-red-500/15 text-red-300' : 'bg-gold text-ink'
          }`}
        >
          {cancelled ? '✕' : '✓'}
        </div>
        <h1 className="mt-5 text-2xl font-bold">{cancelled ? 'Bokningen är avbokad' : 'Du är bokad!'}</h1>
        <p className="mt-1 text-mute">{cancelled ? 'Välkommen åter.' : `Vi ses, ${b.customer_name.split(' ')[0]}.`}</p>
      </div>

      <div className="card rise mt-8 divide-y divide-line">
        {[
          ['Salong', salon.name],
          ['Tjänst', b.service_name + (b.price_sek != null ? ` · ${b.price_sek} kr` : '')],
          ['Frisör', staff?.name],
          ['När', `${prettyDate(date)} kl ${fmtTz(b.starts_at, salon.timezone, 'HH:mm')}`],
          ...(salon.address ? [['Var', salon.address]] : []),
        ].map(([k, v]) => (
          <div key={k} className="flex justify-between gap-4 px-5 py-3.5 text-sm">
            <span className="text-mute">{k}</span>
            <span className="text-right font-medium">{v}</span>
          </div>
        ))}
      </div>

      <p className="mt-4 text-center text-xs text-mute">Spara den här sidan – här kan du avboka.</p>

      <div className="mt-6 grid gap-3">
        {!cancelled && !past && (
          <>
            <a href={`/api/booking-ics/${token}`} className="btn-ghost">📅 Lägg till i kalendern</a>
            <form action={cancel}>
              <input type="hidden" name="token" value={token} />
              <button className="btn w-full text-red-300 hover:bg-red-500/10">Avboka</button>
            </form>
          </>
        )}
        <Link href={`/${salon.slug}`} className="btn-ghost">{cancelled ? 'Boka ny tid' : 'Tillbaka till salongen'}</Link>
      </div>
    </main>
  )
}
