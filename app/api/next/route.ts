import { NextResponse } from 'next/server'
import { getAvailabilityRange } from '@/lib/availability'

export const dynamic = 'force-dynamic'

// Närmaste lediga tider (för "Snabbast"-raden i bokningen)
export async function GET(req: Request) {
  const u = new URL(req.url)
  const salon = u.searchParams.get('salon') ?? ''
  const service = u.searchParams.get('service') ?? ''
  const staff = u.searchParams.get('staff') ?? 'any'
  const exclude = u.searchParams.get('exclude') ?? undefined
  if (!salon || !service) return NextResponse.json({ error: 'Felaktig förfrågan' }, { status: 400 })

  const r = await getAvailabilityRange(salon, service, staff, 'today', { days: 14, excludeBookingId: exclude })
  const out: { date: string; time: string; staffIds: string[] }[] = []
  for (const [date, slots] of Object.entries(r?.byDay ?? {})) {
    for (const s of slots) {
      // var 30:e minut räcker i snabblistan
      if (out.length && out[out.length - 1].date === date && Number(s.time.slice(3)) % 30 !== 0) continue
      out.push({ date, ...s })
      if (out.length >= 6) break
    }
    if (out.length >= 6) break
  }
  return NextResponse.json({ slots: out })
}
