import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { createClient } from './supabase/server'

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
}

export async function requireSalon() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: m } = await supabase.from('salon_members').select('salon_id').eq('user_id', user.id).limit(1).maybeSingle()
  if (!m) redirect('/onboarding')
  const { data: salon } = await supabase.from('salons').select('*').eq('id', m.salon_id).single()
  if (!salon) redirect('/onboarding')
  return { supabase, user, salon: salon as Salon }
}

export async function origin() {
  const h = await headers()
  const host = h.get('x-forwarded-host') ?? h.get('host') ?? 'localhost:3000'
  const proto = h.get('x-forwarded-proto') ?? (host.startsWith('localhost') ? 'http' : 'https')
  return `${proto}://${host}`
}

export const RESERVED = ['login', 'dashboard', 'onboarding', 'api', 'auth', 'b', 'admin', 'app', 'www', 'me', 'for-salonger', 'frisorer']

export function slugify(s: string) {
  return s
    .toLowerCase()
    .replace(/[åä]/g, 'a')
    .replace(/ö/g, 'o')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40)
}
