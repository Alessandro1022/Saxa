import { cache } from 'react'
import { admin } from './supabase/admin'
import { getAuth } from './auth'

export type Me = { id: string; email: string; full_name: string | null; phone: string | null; avatar_url: string | null }

/** Inloggad användare + kundprofil, eller null. */
export const getMe = cache(async (): Promise<Me | null> => {
  const user = await getAuth()
  if (!user) return null
  const { data } = await admin().from('customers').select('full_name, phone, avatar_url').eq('id', user.id).maybeSingle()
  return {
    id: user.id,
    email: user.email,
    full_name: data?.full_name ?? (user.meta.full_name as string | undefined) ?? null,
    phone: data?.phone ?? null,
    avatar_url: data?.avatar_url ?? null,
  }
})
