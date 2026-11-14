import { NextResponse } from 'next/server'
import { admin } from '@/lib/supabase/admin'
import { stripe, stripeEnabled } from '@/lib/stripe'

// Kunden avbröt betalningen → släpp tiden och gå tillbaka till salongen
export async function GET(req: Request) {
  const u = new URL(req.url)
  const token = u.searchParams.get('token') ?? ''
  if (!/^[0-9a-f-]{36}$/i.test(token)) return NextResponse.redirect(new URL('/', u.origin))
  const db = admin()
  const { data: b } = await db.from('bookings').select('id, status, stripe_session_id, salons(slug)').eq('cancel_token', token).single()
  if (b?.status === 'pending') {
    await db.from('bookings').update({ status: 'cancelled', payment_status: null }).eq('id', b.id).eq('status', 'pending')
    if (b.stripe_session_id && stripeEnabled()) await stripe().checkout.sessions.expire(b.stripe_session_id).catch(() => {})
  }
  const slug = (b?.salons as unknown as { slug: string } | null)?.slug
  return NextResponse.redirect(new URL(slug ? `/${slug}?betalning=avbruten#boka` : '/', u.origin))
}
