'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { admin } from '@/lib/supabase/admin'

async function uid() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login?next=/me')
  return user.id
}

export async function cancelMyBooking(f: FormData) {
  const id = await uid()
  await admin()
    .from('bookings')
    .update({ status: 'cancelled' })
    .eq('id', String(f.get('id')))
    .eq('customer_id', id)
    .gt('starts_at', new Date().toISOString())
  revalidatePath('/me')
}

export async function addReview(f: FormData) {
  const id = await uid()
  const bookingId = String(f.get('booking_id'))
  const rating = Math.round(Number(f.get('rating')))
  if (!(rating >= 1 && rating <= 5)) return
  const db = admin()
  const { data: b } = await db
    .from('bookings')
    .select('id, salon_id, staff_id, ends_at, status, customer_id')
    .eq('id', bookingId)
    .single()
  if (!b || b.customer_id !== id || b.status !== 'confirmed' || Date.parse(b.ends_at) > Date.now()) return
  await db.from('reviews').upsert(
    {
      booking_id: b.id,
      salon_id: b.salon_id,
      staff_id: b.staff_id,
      customer_id: id,
      rating,
      comment: String(f.get('comment') ?? '').trim().slice(0, 600) || null,
    },
    { onConflict: 'booking_id' }
  )
  revalidatePath('/me')
}

export async function saveProfile(f: FormData) {
  const id = await uid()
  const supabase = await createClient()
  await supabase.from('customers').upsert({
    id,
    full_name: String(f.get('full_name') ?? '').trim() || null,
    phone: String(f.get('phone') ?? '').trim() || null,
    avatar_url: String(f.get('avatar_url') ?? '') || null,
  })
  revalidatePath('/', 'layout')
  redirect('/me/profil?ok=1')
}

export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/')
}
