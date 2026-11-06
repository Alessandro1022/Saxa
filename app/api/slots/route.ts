import { NextResponse } from 'next/server'
import { getAvailability, MAX_DAYS_AHEAD } from '@/lib/availability'
import { isDate } from '@/lib/time'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  const u = new URL(req.url)
  const salon = u.searchParams.get('salon') ?? ''
  const service = u.searchParams.get('service') ?? ''
  const staff = u.searchParams.get('staff') ?? 'any'
  const date = u.searchParams.get('date') ?? ''
  if (!salon || !service || !isDate(date)) return NextResponse.json({ error: 'Felaktig förfrågan' }, { status: 400 })
  if (Date.parse(date) > Date.now() + MAX_DAYS_AHEAD * 86400000) return NextResponse.json({ slots: [] })

  const av = await getAvailability(salon, service, staff, date)
  if (!av) return NextResponse.json({ error: 'Hittades inte' }, { status: 404 })
  return NextResponse.json({ slots: av.slots })
}
