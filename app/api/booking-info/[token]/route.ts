import { NextResponse } from 'next/server'
import { admin } from '@/lib/supabase/admin'
import { bookingRef } from '@/lib/ref'

export const dynamic = 'force-dynamic'

// Används av iOS-appen (påminnelser) och av "Bokningar" för den som bokat utan konto
export async function GET(_: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  if (!/^[0-9a-f-]{36}$/i.test(token)) return NextResponse.json({ error: 'not found' }, { status: 404 })
  const { data: b } = await admin().from('bookings').select('*, salons(name, address), staff(name)').eq('cancel_token', token).single()
  if (!b) return NextResponse.json({ error: 'not found' }, { status: 404 })
  const s = b.salons as unknown as { name: string; address: string | null }
  return NextResponse.json({
    ref: bookingRef(b.id),
    starts_at: b.starts_at,
    status: b.status,
    service: b.service_name,
    salon: s.name,
    address: s.address,
    staff: (b.staff as unknown as { name: string } | null)?.name ?? null,
    payment_status: b.payment_status ?? null,
    due_sek: b.due_sek ?? null,
  })
}
