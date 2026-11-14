import Stripe from 'stripe'
import { admin } from './supabase/admin'

/** Stripe är aktivt när STRIPE_SECRET_KEY finns i Vercel. */
export const stripeEnabled = () => !!process.env.STRIPE_SECRET_KEY

let client: Stripe | null = null
export function stripe() {
  if (!client) client = new Stripe(process.env.STRIPE_SECRET_KEY!)
  return client
}

/** Plattformsavgift i procent (t.ex. 0 eller 3). */
export const feePercent = () => Math.max(0, Math.min(20, Number(process.env.PLATFORM_FEE_PERCENT ?? 0)))

export type PayCfg = { mode: 'none' | 'deposit' | 'full'; deposit: number }

/** Hur mycket som ska betalas vid bokning för en tjänst. 0 = ingen betalning. */
export function amountFor(cfg: PayCfg, price: number | null | undefined) {
  if (cfg.mode === 'none') return 0
  const p = price ?? 0
  const a = cfg.mode === 'full' ? p : Math.min(cfg.deposit, p || cfg.deposit)
  return a >= 5 ? a : 0
}

/** Salongens betalinställningar – bara om Stripe är på och kontot är klart. */
export function payCfg(salon: Record<string, unknown>): PayCfg {
  const ok = stripeEnabled() && !!salon.stripe_account_id && salon.payments_ready === true
  const mode = (salon.pay_mode as PayCfg['mode']) ?? 'none'
  return { mode: ok ? mode : 'none', deposit: Number(salon.deposit_sek ?? 100) }
}

/** Tider som hålls för betalning släpps efter 35 min. */
export const PENDING_MINUTES = 35

export async function releaseStalePending() {
  const cutoff = new Date(Date.now() - PENDING_MINUTES * 60000).toISOString()
  await admin().from('bookings').update({ status: 'cancelled', payment_status: null }).eq('status', 'pending').lt('created_at', cutoff)
}

/** Markera betald och bekräftad (idempotent – används av både webhook och bekräftelsesidan). */
export async function confirmPaid(session: Stripe.Checkout.Session) {
  const id = session.metadata?.booking_id
  if (!id || session.payment_status !== 'paid') return false
  const pi = typeof session.payment_intent === 'string' ? session.payment_intent : session.payment_intent?.id
  const { data } = await admin()
    .from('bookings')
    .update({ status: 'confirmed', payment_status: 'paid', paid_sek: Math.round((session.amount_total ?? 0) / 100), stripe_payment_intent: pi ?? null })
    .eq('id', id)
    .eq('payment_status', 'pending')
    .select('id')
  return !!data?.length // true första gången den blev betald
}

/** Återbetala om bokningen är betald. Kastar aldrig fel. */
export async function refundIfPaid(bookingId: string) {
  try {
    const db = admin()
    const { data: b } = await db.from('bookings').select('payment_status, stripe_payment_intent').eq('id', bookingId).single()
    if (!b || b.payment_status !== 'paid' || !b.stripe_payment_intent || !stripeEnabled()) return
    await stripe().refunds.create({ payment_intent: b.stripe_payment_intent, reverse_transfer: true, refund_application_fee: true })
    await db.from('bookings').update({ payment_status: 'refunded' }).eq('id', bookingId)
  } catch (e) {
    console.error('refund', e)
  }
}
