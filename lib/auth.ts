import { cache } from 'react'
import { createClient } from './supabase/server'

export type AuthUser = { id: string; email: string; meta: Record<string, unknown> }

/**
 * Snabb inloggningskoll: verifierar JWT:n lokalt (getClaims) istället för ett extra
 * nätverksanrop till Supabase Auth på varje sidvisning. Cachas per request.
 */
export const getAuth = cache(async (): Promise<AuthUser | null> => {
  const supabase = await createClient()
  const { data, error } = await supabase.auth.getClaims()
  const c = data?.claims
  if (error || !c?.sub) return null
  return { id: c.sub, email: (c.email as string) ?? '', meta: (c.user_metadata as Record<string, unknown>) ?? {} }
})
