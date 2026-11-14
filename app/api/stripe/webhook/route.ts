import { NextResponse } from 'next/server'
import type Stripe from 'stripe'
import { admin } from '@/lib/supabase/admin'
import { confirmPaid, stripe } from '@/lib/stripe'
import { notifyBooking } from '@/lib/notify'

// Stripe → Saxa. Lägg upp endpointen i Stripe Dashboard → Developers → Webhooks:
//   URL: https://<din-domän>/api/stripe/webhook
//   Händelser: checkout.session.completed, checkout.session.expired, account.updated
//   Markera "Listen to events on Connected accounts" för account.updated.
export async function POST(req: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET
  if (!secret) return new NextResponse('Webhook secret saknas', { status: 500 })
  let event: Stripe.Event
  try {
    event = stripe().webhooks.constructEvent(await req.text(), req.headers.get('stripe-signature') ?? '', secret)
  } catch {
    return new NextResponse('Ogiltig signatur', { status: 400 })
  }
  const db = admin()
  const site = new URL(req.url).origin

  if (event.type === 'checkout.session.completed' || event.type === 'checkout.session.async_payment_succeeded') {
    const s = event.data.object as Stripe.Checkout.Session
    if (await confirmPaid(s)) await notifyBooking(s.metadata!.booking_id, 'new', site)
  } else if (event.type === 'checkout.session.expired') {
    const id = (event.data.object as Stripe.Checkout.Session).metadata?.booking_id
    if (id) await db.from('bookings').update({ status: 'cancelled', payment_status: null }).eq('id', id).eq('status', 'pending')
  } else if (event.type === 'account.updated') {
    const a = event.data.object as Stripe.Account
    await db.from('salons').update({ payments_ready: !!a.charges_enabled }).eq('stripe_account_id', a.id)
  }
  return NextResponse.json({ received: true })
}
