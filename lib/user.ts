import { createClient } from './supabase/server'
import { admin } from './supabase/admin'

export type Me = { id: string; email: string; full_name: string | null; phone: string | null; avatar_url: string | null }

/** Inloggad användare + kundprofil, eller null. */
export async function getMe(): Promise<Me | null> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null
  const { data } = await admin().from('customers').select('full_name, phone, avatar_url').eq('id', user.id).maybeSingle()
  return {
    id: user.id,
    email: user.email ?? '',
    full_name: data?.full_name ?? (user.user_metadata?.full_name as string | undefined) ?? null,
    phone: data?.phone ?? null,
    avatar_url: data?.avatar_url ?? null,
  }
}
