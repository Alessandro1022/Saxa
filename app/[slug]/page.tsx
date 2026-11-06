import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { admin } from '@/lib/supabase/admin'
import BookingFlow from '@/components/BookingFlow'

export const dynamic = 'force-dynamic'

async function load(slug: string) {
  const db = admin()
  const { data: salon } = await db
    .from('salons')
    .select('id, slug, name, description, address, phone, instagram, logo_url, cover_url, timezone')
    .eq('slug', slug)
    .single()
  if (!salon) return null
  const [{ data: staff }, { data: services }] = await Promise.all([
    db.from('staff').select('id, name, title, bio, photo_url').eq('salon_id', salon.id).eq('active', true).order('sort'),
    db
      .from('services')
      .select('id, name, description, duration_min, price_sek')
      .eq('salon_id', salon.id)
      .eq('active', true)
      .order('sort'),
  ])
  return { salon, staff: staff ?? [], services: services ?? [] }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const data = await load((await params).slug)
  return { title: data ? `Boka ${data.salon.name}` : 'Saxa' }
}

export default async function SalonPage({ params }: { params: Promise<{ slug: string }> }) {
  const data = await load((await params).slug)
  if (!data) notFound()
  const { salon, staff, services } = data

  return (
    <main className="mx-auto max-w-md pb-40">
      <header className="relative">
        <div
          className="h-44 w-full bg-card bg-cover bg-center"
          style={salon.cover_url ? { backgroundImage: `url(${salon.cover_url})` } : undefined}
        >
          <div className="h-full w-full bg-gradient-to-b from-transparent to-ink" />
        </div>
        <div className="-mt-12 px-5">
          <div className="h-20 w-20 overflow-hidden rounded-3xl border-4 border-ink bg-gold">
            {salon.logo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={salon.logo_url} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full items-center justify-center text-3xl font-black text-ongold">{salon.name[0]}</div>
            )}
          </div>
          <h1 className="mt-3 text-2xl font-bold tracking-tight">{salon.name}</h1>
          {salon.description && <p className="mt-1 text-mute">{salon.description}</p>}
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-mute">
            {salon.address && <span>📍 {salon.address}</span>}
            {salon.phone && <a href={`tel:${salon.phone}`}>📞 {salon.phone}</a>}
            {salon.instagram && (
              <a href={`https://instagram.com/${salon.instagram.replace('@', '')}`} target="_blank" rel="noreferrer">
                @{salon.instagram.replace('@', '')}
              </a>
            )}
          </div>
        </div>
      </header>

      {services.length && staff.length ? (
        <BookingFlow salonId={salon.id} tz={salon.timezone} staff={staff} services={services} />
      ) : (
        <p className="card m-5 p-5 text-mute">Salongen har inte öppnat onlinebokningen än.</p>
      )}
    </main>
  )
}
