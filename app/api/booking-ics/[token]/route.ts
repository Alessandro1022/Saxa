import { admin } from '@/lib/supabase/admin'
import { buildICS } from '@/lib/ics'

export async function GET(_: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  if (!/^[0-9a-f-]{36}$/i.test(token)) return new Response('Not found', { status: 404 })
  const { data: b } = await admin()
    .from('bookings')
    .select('id, starts_at, ends_at, service_name, salons(name, address)')
    .eq('cancel_token', token)
    .eq('status', 'confirmed')
    .single()
  if (!b) return new Response('Not found', { status: 404 })
  const salon = b.salons as unknown as { name: string; address: string | null }
  const ics = buildICS(salon.name, [
    {
      uid: b.id,
      start: new Date(b.starts_at),
      end: new Date(b.ends_at),
      summary: `${b.service_name} – ${salon.name}`,
      location: salon.address ?? undefined,
    },
  ])
  return new Response(ics, {
    headers: { 'Content-Type': 'text/calendar; charset=utf-8', 'Content-Disposition': 'attachment; filename="bokning.ics"' },
  })
}
