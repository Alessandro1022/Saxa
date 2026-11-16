import { NextResponse } from 'next/server'
import { revalidateTag } from 'next/cache'
import { admin } from '@/lib/supabase/admin'
import { getAuth } from '@/lib/auth'

// Rapportera ett omdöme. Tre rapporter döljer omdömet för alla tills det granskats.
export async function POST(req: Request) {
  const b = await req.json().catch(() => null)
  const reviewId = String(b?.reviewId ?? '')
  if (!/^[0-9a-f-]{36}$/i.test(reviewId)) return NextResponse.json({ error: 'Felaktig förfrågan' }, { status: 400 })
  const db = admin()
  const user = await getAuth()
  const { error } = await db.from('review_reports').insert({ review_id: reviewId, reporter_id: user?.id ?? null, reason: String(b?.reason ?? '').slice(0, 300) || null })
  if (error) {
    console.error('report', error)
    return NextResponse.json({ error: 'Kunde inte skicka rapporten' }, { status: 500 })
  }
  const { count } = await db.from('review_reports').select('*', { count: 'exact', head: true }).eq('review_id', reviewId)
  if ((count ?? 0) >= 3) {
    await db.from('reviews').update({ hidden: true }).eq('id', reviewId)
    revalidateTag('public')
  }
  return NextResponse.json({ ok: true })
}
