import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Flash, Logo } from '@/components/ui'
import OnboardingForm from '@/components/OnboardingForm'

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
      <OnboardingForm />
    </main>
  )
}
