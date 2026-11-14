import { NextResponse } from 'next/server'
import { admin } from '@/lib/supabase/admin'
import { getAuth } from '@/lib/auth'
import { isExpoToken, sendPush } from '@/lib/push'
import { fmtTz, prettyDate } from '@/lib/time'
import { bookingRef } from '@/lib/ref'

// iOS-appen anmäler telefonen för push. Fungerar med och utan inloggning.
export async function POST(req: Request) {
  const b = await req.json().catch(() => null)
  const expoToken = b?.expoToken
  const bookingToken = typeof b?.bookingToken === 'string' ? b.bookingToken : ''
  if (!isExpoToken(expoToken)) return NextResponse.json({ error: 'bad token' }, { status: 400 })

  const db = admin()
  const user = await getAuth()
  // Telefonen följer den som är inloggad just nu (null = utloggad)
  await db.from('push_devices').upsert({ expo_token: expoToken, user_id: user?.id ?? null, updated_at: new Date().toISOString() })

  if (/^[0-9a-f-]{36}$/i.test(bookingToken)) {
    const { data: bk } = await db.from('bookings').select('id, starts_at, status, created_at, service_name, salons(name, timezone)').eq('cancel_token', bookingToken).single()
    if (bk) {
      const { error } = await db.from('push_bookings').insert({ booking_id: bk.id, expo_token: expoToken })
      // Första gången telefonen ser en nygjord bokning → bekräftelse som notis
      if (!error && bk.status === 'confirmed' && Date.now() - Date.parse(bk.created_at) < 3 * 60_000) {
        const s = bk.salons as unknown as { name: string; timezone: string }
        const site = new URL(req.url).origin
        await sendPush([expoToken], {
          title: 'Du är bokad! ✂️',
          body: `${bk.service_name} · ${prettyDate(fmtTz(bk.starts_at, s.timezone, 'yyyy-MM-dd'))} kl ${fmtTz(bk.starts_at, s.timezone, 'HH:mm')} hos ${s.name} · ${bookingRef(bk.id)}`,
          url: `${site}/b/${bookingToken}`,
        })
      }
    }
  }
  return NextResponse.json({ ok: true })
}
