import Link from 'next/link'
import { redirect } from 'next/navigation'
import { CalendarPlus, Clock, MapPin, Scissors, Star, X } from 'lucide-react'
import { admin } from '@/lib/supabase/admin'
import { getMe } from '@/lib/user'
import { fmtTz, prettyDate } from '@/lib/time'
import CustomerNav from '@/components/CustomerNav'
import ThemeToggle from '@/components/ThemeToggle'
import ReviewForm from '@/components/ReviewForm'
import { Avatar } from '@/components/ui'
import { Cover } from '@/components/Img'
import { cancelMyBooking } from './actions'

export const dynamic = 'force-dynamic'

type B = {
  id: string
  starts_at: string
  ends_at: string
  service_name: string
  price_sek: number | null
  status: string
  cancel_token: string
  salons: { name: string; slug: string; address: string | null; city: string | null; cover_url: string | null; logo_url: string | null; timezone: string }
  staff: { name: string; photo_url: string | null } | null
}

export default async function MyBookings() {
  const me = await getMe()
  if (!me) redirect('/login?next=/me')
  const db = admin()
  const [{ data }, { data: reviews }] = await Promise.all([
    db
      .from('bookings')
      .select('id, starts_at, ends_at, service_name, price_sek, status, cancel_token, salons(name, slug, address, city, cover_url, logo_url, timezone), staff(name, photo_url)')
      .eq('customer_id', me.id)
      .order('starts_at', { ascending: false })
      .limit(100),
    db.from('reviews').select('booking_id, rating').eq('customer_id', me.id),
  ])
  const list = (data ?? []) as unknown as B[]
  const rated = new Map((reviews ?? []).map((r) => [r.booking_id as string, r.rating as number]))
  const now = Date.now()
  const upcoming = list.filter((b) => b.status === 'confirmed' && Date.parse(b.ends_at) > now).reverse()
  const past = list.filter((b) => !(b.status === 'confirmed' && Date.parse(b.ends_at) > now))

  return (
    <main className="mx-auto max-w-2xl px-5 pb-32 pt-[max(env(safe-area-inset-top),20px)]">
      <header className="rise flex items-center gap-3 pt-2">
        <h1 className="flex-1 text-[30px] font-bold tracking-tight">Bokningar</h1>
        <ThemeToggle />
        <Link href="/me/profil"><Avatar name={me.full_name ?? me.email} src={me.avatar_url} size={44} /></Link>
      </header>

      <section className="mt-6">
        <h2 className="mb-3 text-sm font-medium text-mute">Kommande</h2>
        {upcoming.length === 0 ? (
          <div className="card rise px-6 py-10 text-center">
            <Scissors className="mx-auto text-gold" />
            <p className="mt-3 font-medium">Inga kommande bokningar</p>
            <Link href="/frisorer" className="btn-gold mt-5 !py-3">Hitta en frisör</Link>
          </div>
        ) : (
          <div className="grid gap-4">
            {upcoming.map((b, i) => {
              const tz = b.salons.timezone
              const date = fmtTz(b.starts_at, tz, 'yyyy-MM-dd')
              return (
                <div key={b.id} className="card rise overflow-hidden" style={{ animationDelay: `${i * 0.05}s` }}>
                  <div className="relative h-28">
                    <Cover src={b.salons.cover_url} icon={28} />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                    <div className="absolute bottom-3 left-4 right-4 flex items-end justify-between text-white">
                      <div>
                        <div className="text-xs uppercase tracking-wider text-white/70">{prettyDate(date)}</div>
                        <div className="text-3xl font-bold leading-none">{fmtTz(b.starts_at, tz, 'HH:mm')}</div>
                      </div>
                      <Link href={`/${b.salons.slug}`} className="text-right">
                        <div className="font-semibold">{b.salons.name}</div>
                        <div className="flex items-center justify-end gap-1 text-xs text-white/70">
                          <MapPin size={12} />
                          {b.salons.address ?? b.salons.city}
                        </div>
                      </Link>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-4">
                    <Avatar name={b.staff?.name ?? '?'} src={b.staff?.photo_url} size={42} />
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-medium">{b.service_name}</div>
                      <div className="flex items-center gap-1 text-sm text-mute">
                        <Clock size={13} /> {fmtTz(b.starts_at, tz, 'HH:mm')}–{fmtTz(b.ends_at, tz, 'HH:mm')} · {b.staff?.name}
                      </div>
                    </div>
                    <a href={`/api/booking-ics/${b.cancel_token}`} className="icon-btn" aria-label="Lägg i kalender"><CalendarPlus size={18} /></a>
                    <form action={cancelMyBooking}>
                      <input type="hidden" name="id" value={b.id} />
                      <button className="icon-btn text-red-400" aria-label="Avboka"><X size={18} /></button>
                    </form>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>

      {past.length > 0 && (
        <section className="mt-10">
          <h2 className="mb-3 text-sm font-medium text-mute">Tidigare</h2>
          <div className="card divide-hair overflow-hidden">
            {past.map((b) => {
              const tz = b.salons.timezone
              const cancelled = b.status === 'cancelled'
              const r = rated.get(b.id)
              return (
                <div key={b.id} className="px-4 py-4">
                  <div className="flex items-center gap-3">
                    <Avatar name={b.salons.name} src={b.salons.logo_url} size={42} />
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-medium">{b.salons.name}</div>
                      <div className="truncate text-sm text-mute">
                        {b.service_name} · {prettyDate(fmtTz(b.starts_at, tz, 'yyyy-MM-dd'))}
                      </div>
                    </div>
                    {cancelled ? (
                      <span className="pill !py-1 text-xs text-mute">Avbokad</span>
                    ) : r ? (
                      <span className="flex items-center gap-1 text-sm font-medium"><Star size={14} className="fill-gold text-gold" />{r}</span>
                    ) : (
                      <Link href={`/${b.salons.slug}`} className="pill !py-1.5 text-xs">Boka igen</Link>
                    )}
                  </div>
                  {!cancelled && !r && <ReviewForm bookingId={b.id} />}
                </div>
              )
            })}
          </div>
        </section>
      )}

      <CustomerNav />
    </main>
  )
}
