import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { RESERVED, slugify } from '@/lib/salon'

async function createSalon(formData: FormData) {
  'use server'
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const name = String(formData.get('name') ?? '').trim()
  const you = String(formData.get('you') ?? '').trim() || 'Jag'
  const slug = slugify(String(formData.get('slug') ?? '') || name)
  if (!name) redirect('/onboarding?e=' + encodeURIComponent('Skriv salongens namn'))
  if (slug.length < 3 || RESERVED.includes(slug)) redirect('/onboarding?e=' + encodeURIComponent('Välj en annan länk'))

  const { data: salon, error } = await supabase
    .from('salons')
    .insert({ name, slug, owner_id: user.id })
    .select('id')
    .single()
  if (error || !salon)
    redirect('/onboarding?e=' + encodeURIComponent(error?.code === '23505' ? 'Länken är redan tagen' : 'Något gick fel'))

  // Bra startvärden så salongen är bokningsbar direkt
  const { data: me } = await supabase.from('staff').insert({ salon_id: salon.id, name: you }).select('id').single()
  if (me) {
    const rows = [1, 2, 3, 4, 5].map((d) => ({ salon_id: salon.id, staff_id: me.id, weekday: d, start_time: '10:00', end_time: '18:00' }))
    rows.push({ salon_id: salon.id, staff_id: me.id, weekday: 6, start_time: '10:00', end_time: '15:00' })
    await supabase.from('staff_hours').insert(rows)
  }
  await supabase.from('services').insert([
    { salon_id: salon.id, name: 'Herrklippning', duration_min: 30, price_sek: 350, sort: 0 },
    { salon_id: salon.id, name: 'Skäggtrim', duration_min: 20, price_sek: 200, sort: 1 },
  ])
  redirect('/dashboard?welcome=1')
}

export default async function Onboarding({ searchParams }: { searchParams: Promise<{ e?: string }> }) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: m } = await supabase.from('salon_members').select('salon_id').eq('user_id', user.id).limit(1).maybeSingle()
  if (m) redirect('/dashboard')
  const { e } = await searchParams

  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center px-6">
      <h1 className="text-3xl font-bold">Välkommen 👋</h1>
      <p className="mt-2 text-mute">Tre fält, sen är du igång.</p>
      {e && <p className="mt-4 rounded-2xl bg-red-500/10 p-3 text-sm text-red-300">{e}</p>}
      <form action={createSalon} className="mt-8 grid gap-4">
        <div>
          <label className="label">Salongens namn</label>
          <input className="input" name="name" required placeholder="Ali's Barbershop" />
        </div>
        <div>
          <label className="label">Bokningslänk</label>
          <div className="flex items-center rounded-2xl border border-line bg-ink pl-4 focus-within:border-gold">
            <span className="text-sm text-mute">saxa.se/</span>
            <input className="w-full bg-transparent px-1 py-3 outline-none" name="slug" placeholder="alis-barbershop" />
          </div>
          <p className="mt-1 text-xs text-mute">Lämna tomt så skapas den från namnet.</p>
        </div>
        <div>
          <label className="label">Ditt namn (visas för kunder)</label>
          <input className="input" name="you" placeholder="Ali" />
        </div>
        <button className="btn-gold mt-2">Skapa salong</button>
      </form>
    </main>
  )
}
