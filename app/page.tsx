import Link from 'next/link'
import { admin } from '@/lib/supabase/admin'
import { getMe } from '@/lib/user'
import Discover, { type SalonCard, type Pro } from '@/components/Discover'
import CustomerNav from '@/components/CustomerNav'
import ThemeToggle from '@/components/ThemeToggle'
import { Avatar, Logo } from '@/components/ui'

export const dynamic = 'force-dynamic'

type R = { avg: number; n: number }

async function load() {
  const db = admin()
  const [salons, staff, services, sr, pr] = await Promise.all([
    db.from('salons').select('id, slug, name, city, address, cover_url, logo_url').order('created_at', { ascending: false }),
    db.from('staff').select('id, salon_id, name, title, photo_url').eq('active', true).order('sort'),
    db.from('services').select('salon_id, price_sek').eq('active', true),
    db.from('salon_rating').select('*'),
    db.from('staff_rating').select('*'),
  ])
  const sRate = new Map<string, R>((sr.data ?? []).map((r: { salon_id: string } & R) => [r.salon_id, r]))
  const pRate = new Map<string, R>((pr.data ?? []).map((r: { staff_id: string } & R) => [r.staff_id, r]))

  const out: SalonCard[] = []
  const pros: Pro[] = []
  for (const s of salons.data ?? []) {
    const team = (staff.data ?? []).filter((x) => x.salon_id === s.id)
    const prices = (services.data ?? []).filter((x) => x.salon_id === s.id)
    if (!team.length || !prices.length) continue // bara bokningsbara salonger
    const nums = prices.map((p) => p.price_sek).filter((p): p is number => p != null)
    out.push({
      ...s,
      rating: sRate.get(s.id)?.avg ?? null,
      reviews: sRate.get(s.id)?.n ?? 0,
      from: nums.length ? Math.min(...nums) : null,
      staff: team.map((t) => ({ id: t.id, name: t.name, photo_url: t.photo_url })),
    })
    for (const t of team)
      pros.push({
        id: t.id,
        name: t.name,
        title: t.title,
        photo_url: t.photo_url,
        salon: { slug: s.slug, name: s.name, city: s.city },
        rating: pRate.get(t.id)?.avg ?? null,
        reviews: pRate.get(t.id)?.n ?? 0,
      })
  }
  return { salons: out, pros }
}

export default async function Home() {
  const [{ salons, pros }, me] = await Promise.all([load(), getMe()])
  const first = me?.full_name?.split(' ')[0]

  return (
    <main className="mx-auto max-w-2xl px-5 pb-32 pt-[max(env(safe-area-inset-top),20px)]">
      <header className="rise flex items-center gap-3 pt-2">
        <Logo size={40} />
        <div className="flex-1" />
        <ThemeToggle />
        {me ? (
          <Link href="/me/profil" aria-label="Profil">
            <Avatar name={me.full_name ?? me.email} src={me.avatar_url} size={44} />
          </Link>
        ) : (
          <Link href="/login" className="btn-soft !px-5 !py-2.5 text-sm">Logga in</Link>
        )}
      </header>

      <section className="rise rise-1 mt-8">
        <h1 className="text-[34px] font-bold leading-[1.1] tracking-tight">
          {first ? <>Hej {first},<br /></> : null}
          <span className="gold-text">Dags för en fresh cut?</span>
        </h1>
        <p className="mt-2 text-mute">Hitta din frisör och boka på sekunder.</p>
      </section>

      <Discover salons={salons} pros={pros} />

      <Link href="/for-salonger" className="card rise mt-10 flex items-center gap-4 p-5">
        <div className="flex-1">
          <div className="font-semibold">Driver du en salong?</div>
          <div className="text-sm text-mute">Kom igång gratis – ingen provision.</div>
        </div>
        <span className="btn-gold !px-5 !py-2.5 text-sm">Läs mer</span>
      </Link>

      <CustomerNav />
    </main>
  )
}
