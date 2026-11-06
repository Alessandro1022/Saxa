import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { RESERVED, slugify } from '@/lib/salon'

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Du är utloggad – logga in igen.' }, { status: 401 })

    const b = await req.json().catch(() => ({}))
    const name = String(b.name ?? '').trim()
    const you = String(b.you ?? '').trim() || 'Jag'
    const city = String(b.city ?? '').trim() || null
    const slug = slugify(String(b.slug ?? '') || name)
    if (!name) return NextResponse.json({ error: 'Skriv salongens namn' }, { status: 400 })
    if (slug.length < 3 || RESERVED.includes(slug)) return NextResponse.json({ error: 'Välj en annan länk (minst 3 tecken)' }, { status: 400 })

    // Har användaren redan en salong? Skicka dit.
    const { data: m } = await supabase.from('salon_members').select('salon_id').eq('user_id', user.id).limit(1).maybeSingle()
    if (m) return NextResponse.json({ ok: true, next: '/dashboard' })

    let { data: salon, error } = await supabase.from('salons').insert({ name, slug, owner_id: user.id, city }).select('id').single()
    if (error?.code === '42703' || error?.code === 'PGRST204')
      ({ data: salon, error } = await supabase.from('salons').insert({ name, slug, owner_id: user.id }).select('id').single())
    if (error || !salon) {
      console.error('onboarding', error)
      const msg = error?.code === '23505' ? 'Länken är redan tagen – välj en annan' : `Kunde inte skapa salongen: ${error?.message ?? 'okänt fel'} (${error?.code ?? '?'})`
      return NextResponse.json({ error: msg }, { status: 400 })
    }

    const { data: me } = await supabase.from('staff').insert({ salon_id: salon.id, name: you }).select('id').single()
    if (me) {
      const rows = [1, 2, 3, 4, 5].map((d) => ({ salon_id: salon!.id, staff_id: me.id, weekday: d, start_time: '10:00', end_time: '18:00' }))
      rows.push({ salon_id: salon.id, staff_id: me.id, weekday: 6, start_time: '10:00', end_time: '15:00' })
      await supabase.from('staff_hours').insert(rows)
    }
    await supabase.from('services').insert([
      { salon_id: salon.id, name: 'Herrklippning', duration_min: 30, price_sek: 350, sort: 0 },
      { salon_id: salon.id, name: 'Skäggtrim', duration_min: 20, price_sek: 200, sort: 1 },
    ])
    return NextResponse.json({ ok: true, next: '/dashboard?welcome=1' })
  } catch (e) {
    console.error('onboarding crash', e)
    return NextResponse.json({ error: `Serverfel: ${e instanceof Error ? e.message : String(e)}` }, { status: 500 })
  }
}
