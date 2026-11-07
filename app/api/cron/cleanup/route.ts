import { NextResponse } from 'next/server'
import { admin } from '@/lib/supabase/admin'

// Körs dagligen av Vercel Cron (vercel.json). Raderar bokningar äldre än 24 månader enligt integritetspolicyn.
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET
  if (secret && req.headers.get('authorization') !== `Bearer ${secret}`) return new NextResponse('Unauthorized', { status: 401 })
  const cutoff = new Date()
  cutoff.setMonth(cutoff.getMonth() - 24)
  const { error, count } = await admin().from('bookings').delete({ count: 'exact' }).lt('ends_at', cutoff.toISOString())
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ deleted: count ?? 0 })
}
