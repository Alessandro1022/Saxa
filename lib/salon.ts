import { cache } from 'react'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { createClient } from './supabase/server'
import { getAuth } from './auth'

export type Salon = {
  id: string
  slug: string
  name: string
  description: string | null
  address: string | null
  city: string | null
  phone: string | null
  instagram: string | null
  logo_url: string | null
  cover_url: string | null
  timezone: string
  cancel_hours?: number
  lead_minutes?: number
  notify_email?: string | null
  stripe_account_id?: string | null
  payments_ready?: boolean
  pay_mode?: 'none' | 'deposit' | 'full'
  deposit_sek?: number
}

export const requireSalon = cache(async () => {
  const supabase = await createClient()
  const user = await getAuth()
  if (!user) redirect('/login?as=salon')
  // Ett anrop: medlemskap + salong
  const { data: m } = await supabase.from('salon_members').select('salons(*)').eq('user_id', user.id).limit(1).maybeSingle()
  const salon = m?.salons as unknown as Salon | null
  if (!salon) redirect('/onboarding')
  return { supabase, user, salon }
})

export async function origin() {
  const h = await headers()
  const host = h.get('x-forwarded-host') ?? h.get('host') ?? 'localhost:3000'
  const proto = h.get('x-forwarded-proto') ?? (host.startsWith('localhost') ? 'http' : 'https')
  return `${proto}://${host}`
}

export const RESERVED = ['login', 'dashboard', 'onboarding', 'api', 'auth', 'b', 'admin', 'app', 'www', 'me', 'for-salonger', 'frisorer', 'integritet', 'support']

export function slugify(s: string) {
  return s
    .toLowerCase()
    .replace(/[åä]/g, 'a')
    .replace(/ö/g, 'o')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40)
}
