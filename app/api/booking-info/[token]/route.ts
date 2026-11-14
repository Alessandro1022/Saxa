import { NextResponse } from 'next/server'
import { admin } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

// Används av iOS-appen för att schemalägga påminnelser
export async function GET(_: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  if (!/^[0-9a-f-]{36}$/i.test(token)) return NextResponse.json({ error: 'not found' }, { status: 404 })
  const { data: b } = await admin()
    .from('bookings')
    .select('starts_at, status, service_name, salons(name, address)')
    .eq('cancel_token', token)
    .single()
  if (!b) return NextResponse.json({ error: 'not found' }, { status: 404 })
  const s = b.salons as unknown as { name: string; address: string | null }
  return NextResponse.json({ starts_at: b.starts_at, status: b.status, service: b.service_name, salon: s.name, address: s.address })
}
