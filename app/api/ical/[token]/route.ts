import { admin } from '@/lib/supabase/admin'
import { buildICS } from '@/lib/ics'

export const dynamic = 'force-dynamic'

// Prenumerationsflöde per frisör → Apple Kalender / Google Kalender
export async function GET(_: Request, { params }: { params: Promise<{ token: string }> }) {
  const raw = (await params).token.replace(/\.ics$/, '')
  if (!/^[0-9a-f-]{36}$/i.test(raw)) return new Response('Not found', { status: 404 })
  const db = admin()
  const { data: staff } = await db.from('staff').select('id, name, salons(name)').eq('ical_token', raw).single()
  if (!staff) return new Response('Not found', { status: 404 })

  const since = new Date(Date.now() - 30 * 86400000).toISOString()
  const { data: bookings } = await db
    .from('bookings')
    .select('id, starts_at, ends_at, service_name, customer_name, customer_phone, note')
    .eq('staff_id', staff.id)
    .eq('status', 'confirmed')
    .gte('starts_at', since)
    .order('starts_at')
    .limit(2000)

  const salonName = (staff.salons as unknown as { name: string })?.name ?? 'Saxa'
  const ics = buildICS(`${salonName} – ${staff.name}`, (bookings ?? []).map((b) => ({
    uid: b.id,
    start: new Date(b.starts_at),
    end: new Date(b.ends_at),
    summary: `${b.customer_name} · ${b.service_name}`,
    description: [b.customer_phone && `Tel: ${b.customer_phone}`, b.note].filter(Boolean).join('\n'),
  })))

  return new Response(ics, {
    headers: { 'Content-Type': 'text/calendar; charset=utf-8', 'Cache-Control': 'no-store' },
  })
}
