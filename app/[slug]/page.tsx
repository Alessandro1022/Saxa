import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { ArrowLeft, MapPin, Phone, Scissors, Star } from 'lucide-react'
import { admin } from '@/lib/supabase/admin'
import { getMe } from '@/lib/user'
import BookingFlow from '@/components/BookingFlow'
import ThemeToggle from '@/components/ThemeToggle'
import { Avatar, Rating } from '@/components/ui'
import { MONTHS } from '@/lib/time'

export const dynamic = 'force-dynamic'

type R = { avg: number; n: number }

async function load(slug: string) {
  const db = admin()
  const { data: salon } = await db
    .from('salons')
    .select('id, slug, name, description, address, city, phone, instagram, logo_url, cover_url, timezone')
    .eq('slug', slug)
    .single()
  if (!salon) return null
  const [{ data: staff }, { data: services }, { data: sr }, { data: pr }, { data: reviews }] = await Promise.all([
    db.from('staff').select('id, name, title, bio, photo_url').eq('salon_id', salon.id).eq('active', true).order('sort'),
    db.from('services').select('id, name, description, duration_min, price_sek').eq('salon_id', salon.id).eq('active', true).order('sort'),
    db.from('salon_rating').select('*').eq('salon_id', salon.id).maybeSingle(),
    db.from('staff_rating').select('*'),
    db.from('reviews').select('id, rating, comment, created_at, customer_id, staff_id').eq('salon_id', salon.id).order('created_at', { ascending: false }).limit(12),
  ])
  const ids = [...new Set((reviews ?? []).map((r) => r.customer_id as string))]
  const { data: people } = ids.length
    ? await db.from('customers').select('id, full_name, avatar_url').in('id', ids)
    : { data: [] as { id: string; full_name: string | null; avatar_url: string | null }[] }
  const pRate = new Map<string, R>((pr ?? []).map((r: { staff_id: string } & R) => [r.staff_id, r]))
  return {
    salon,
    staff: (staff ?? []).map((s) => ({ ...s, rating: pRate.get(s.id) ?? null })),
    services: services ?? [],
    rating: (sr as R | null) ?? null,
    reviews: (reviews ?? []).map((r) => ({ ...r, who: (people ?? []).find((p) => p.id === r.customer_id) })),
  }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const data = await load((await params).slug)
  return { title: data ? `Boka ${data.salon.name}` : 'Saxa' }
}

export default async function SalonPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ staff?: string }>
}) {
  const [data, me, sp] = await Promise.all([load((await params).slug), getMe(), searchParams])
  if (!data) notFound()
  const { salon, staff, services, rating, reviews } = data
  const insta = salon.instagram?.replace('@', '')

  return (
    <main className="mx-auto max-w-2xl pb-44">
      <header className="relative h-[300px] overflow-hidden sm:mt-4 sm:rounded-[36px]">
        {salon.cover_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={salon.cover_url} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center" style={{ background: 'radial-gradient(circle at 30% 10%, rgb(var(--gold) / .45), rgb(var(--card)) 70%)' }}>
            <Scissors size={56} className="text-gold/50" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-[rgb(var(--ink))]" />
        <div className="absolute inset-x-5 top-[max(env(safe-area-inset-top),16px)] flex justify-between">
          <Link href="/" className="icon-btn !bg-black/30 text-white backdrop-blur-md" aria-label="Tillbaka"><ArrowLeft size={18} /></Link>
          <ThemeToggle className="!bg-black/30 text-white backdrop-blur-md" />
        </div>
      </header>

      <section className="rise relative -mt-16 px-5">
        <Avatar name={salon.name} src={salon.logo_url} size={84} className="ring-4 ring-[rgb(var(--ink))]" />
        <h1 className="mt-3 text-[30px] font-bold leading-tight tracking-tight">{salon.name}</h1>
        <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-mute">
          <Rating avg={rating?.avg} n={rating?.n} className="text-fg" />
          {(salon.address || salon.city) && (
            <span className="flex items-center gap-1"><MapPin size={14} />{[salon.address, salon.city].filter(Boolean).join(', ')}</span>
          )}
        </div>
        {salon.description && <p className="mt-3 text-[15px] leading-relaxed text-mute">{salon.description}</p>}
        <div className="mt-4 flex gap-2">
          {salon.phone && <a href={`tel:${salon.phone}`} className="pill flex items-center gap-1.5"><Phone size={14} /> Ring</a>}
          {insta && <a href={`https://instagram.com/${insta}`} target="_blank" rel="noreferrer" className="pill">@{insta}</a>}
        </div>
      </section>

      {staff.length > 0 && (
        <section className="rise rise-1 mt-8">
          <h2 className="px-5 text-sm font-medium text-mute">Teamet</h2>
          <div className="no-scrollbar mt-3 flex gap-3 overflow-x-auto px-5">
            {staff.map((s) => (
              <Link
                key={s.id}
                href={`/${salon.slug}?staff=${s.id}#boka`}
                scroll={false}
                className={`tile w-[132px] shrink-0 text-center ${sp.staff === s.id ? 'tile-on' : ''}`}
              >
                <Avatar name={s.name} src={s.photo_url} size={72} className="mx-auto" />
                <div className="mt-2.5 truncate font-semibold">{s.name}</div>
                <div className="truncate text-xs text-mute">{s.title ?? 'Frisör'}</div>
                <Rating avg={s.rating?.avg} n={s.rating?.n} className="mt-1 justify-center text-xs" />
              </Link>
            ))}
          </div>
        </section>
      )}

      <div id="boka" className="scroll-mt-4">
        {services.length && staff.length ? (
          <BookingFlow
            key={sp.staff ?? 'all'}
            salonId={salon.id}
            tz={salon.timezone}
            staff={staff}
            services={services}
            initialStaff={staff.some((s) => s.id === sp.staff) ? sp.staff : undefined}
            me={me ? { name: me.full_name ?? '', phone: me.phone ?? '', email: me.email } : null}
          />
        ) : (
          <p className="card mx-5 mt-8 p-6 text-center text-mute">Salongen har inte öppnat onlinebokningen än.</p>
        )}
      </div>

      {reviews.length > 0 && (
        <section className="mt-12 px-5">
          <h2 className="flex items-center gap-2 text-sm font-medium text-mute">
            <Star size={14} className="fill-gold text-gold" /> {rating?.avg?.toFixed(1)} · {rating?.n} omdömen
          </h2>
          <div className="no-scrollbar -mx-5 mt-3 flex gap-3 overflow-x-auto px-5">
            {reviews.map((r) => {
              const d = new Date(r.created_at)
              const who = r.who?.full_name?.split(' ')[0] ?? 'Kund'
              return (
                <div key={r.id} className="card w-[260px] shrink-0 p-4">
                  <div className="flex items-center gap-2.5">
                    <Avatar name={who} src={r.who?.avatar_url} size={34} />
                    <div className="flex-1">
                      <div className="text-sm font-medium">{who}</div>
                      <div className="text-xs text-mute">{d.getDate()} {MONTHS[d.getMonth()]}</div>
                    </div>
                    <div className="flex">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} size={12} className={i < r.rating ? 'fill-gold text-gold' : 'text-mute/40'} />
                      ))}
                    </div>
                  </div>
                  {r.comment && <p className="mt-3 line-clamp-4 text-sm leading-relaxed">{r.comment}</p>}
                </div>
              )
            })}
          </div>
        </section>
      )}
    </main>
  )
}
