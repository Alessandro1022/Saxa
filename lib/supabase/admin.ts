import { createClient } from '@supabase/supabase-js'

// Endast på servern. Används för publika sidor (bokning) där kunden inte är inloggad.
export function admin() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}
