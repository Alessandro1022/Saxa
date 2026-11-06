import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { RESERVED, slugify } from '@/lib/salon'
import { Flash, Logo } from '@/components/ui'

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
    .insert({ name, slug, owner_id: user.id, city: String(formData.get('city') ?? '').trim() || null })
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
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center px-6 py-10">
      <div className="rise">
        <Logo size={52} />
        <h1 className="mt-6 text-3xl font-bold tracking-tight">Skapa din salong</h1>
        <p className="mt-1.5 text-mute">Fyra fält, sen är du bokningsbar.</p>
      </div>
      <div className="mt-6"><Flash e={e} /></div>
      <form action={createSalon} className="rise rise-1 grid gap-3">
        <input className="input" name="name" required placeholder="Salongens namn, t.ex. Ali's Barbershop" />
        <div className="flex items-center rounded-2xl pl-4" style={{ background: 'color-mix(in srgb, rgb(var(--fg)) 4.5%, rgb(var(--ink)))' }}>
          <span className="text-sm text-mute">saxa.se/</span>
          <input className="w-full bg-transparent px-1 py-3.5 text-[15px] outline-none placeholder:text-mute" name="slug" placeholder="din-salong (valfritt)" />
        </div>
        <input className="input" name="city" placeholder="Stad, t.ex. Göteborg" />
        <input className="input" name="you" placeholder="Ditt namn (visas för kunder)" />
        <button className="btn-gold mt-2">Skapa salong</button>
      </form>
    </main>
  )
}
