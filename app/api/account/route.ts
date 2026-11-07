import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { admin } from '@/lib/supabase/admin'

// Radera eget konto (krav från Apple för appar med kontoskapande)
export async function DELETE() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Inte inloggad' }, { status: 401 })

  const db = admin()
  // Avboka kommande bokningar så tiderna blir lediga
  await db.from('bookings').update({ status: 'cancelled' }).eq('customer_id', user.id).gt('starts_at', new Date().toISOString())
  // Salonger där användaren är ensam ägare tas bort
  const { data: owned } = await db.from('salons').select('id').eq('owner_id', user.id)
  for (const s of owned ?? []) {
    const { count } = await db.from('salon_members').select('*', { count: 'exact', head: true }).eq('salon_id', s.id)
    if ((count ?? 0) <= 1) await db.from('salons').delete().eq('id', s.id)
  }
  const { error } = await db.auth.admin.deleteUser(user.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  await supabase.auth.signOut()
  return NextResponse.json({ ok: true })
}
