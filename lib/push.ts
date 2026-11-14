import { admin } from './supabase/admin'

type Msg = { title: string; body: string; url: string }

const isExpoToken = (t: unknown): t is string => typeof t === 'string' && /^Expo(nent)?PushToken\[[^\]]+\]$/.test(t)
export { isExpoToken }

/** Skickar push via Expos tjänst. Kastar aldrig fel; ogiltiga telefoner rensas bort. */
export async function sendPush(tokens: string[], msg: Msg) {
  const to = [...new Set(tokens.filter(isExpoToken))]
  if (!to.length) return
  try {
    const r = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(to.map((t) => ({ to: t, title: msg.title, body: msg.body, sound: 'default', data: { url: msg.url } }))),
    })
    const d = (await r.json().catch(() => null)) as { data?: { status: string; details?: { error?: string } }[] } | null
    const dead = to.filter((_, i) => d?.data?.[i]?.details?.error === 'DeviceNotRegistered')
    if (dead.length) {
      const db = admin()
      await db.from('push_devices').delete().in('expo_token', dead)
      await db.from('push_bookings').delete().in('expo_token', dead)
    }
  } catch (e) {
    console.error('push', e)
  }
}

/** Telefoner som hör till kunden för en bokning: den telefon som bokade + kundens inloggade telefoner. */
export async function customerTokens(bookingId: string, customerId: string | null) {
  const db = admin()
  const [a, b] = await Promise.all([
    db.from('push_bookings').select('expo_token').eq('booking_id', bookingId),
    customerId ? db.from('push_devices').select('expo_token').eq('user_id', customerId) : Promise.resolve({ data: [] as { expo_token: string }[] }),
  ])
  return [...(a.data ?? []), ...(b.data ?? [])].map((r) => r.expo_token as string)
}

/** Telefoner där någon från salongen är inloggad. */
export async function salonTokens(salonId: string) {
  const db = admin()
  const { data: members } = await db.from('salon_members').select('user_id').eq('salon_id', salonId)
  const ids = (members ?? []).map((m) => m.user_id as string)
  if (!ids.length) return []
  const { data } = await db.from('push_devices').select('expo_token').in('user_id', ids)
  return (data ?? []).map((r) => r.expo_token as string)
}
