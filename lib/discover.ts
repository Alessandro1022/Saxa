import { admin } from './supabase/admin'
import type { SalonCard, Pro } from '@/components/Discover'

type R = { avg: number; n: number }

export async function loadDiscover(): Promise<{ salons: SalonCard[]; pros: Pro[] }> {
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

