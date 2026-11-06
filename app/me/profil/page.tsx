import Link from 'next/link'
import SubmitButton from '@/components/SubmitButton'
import { redirect } from 'next/navigation'
import { ChevronRight, LogOut, Store } from 'lucide-react'
import { getMe } from '@/lib/user'
import { createClient } from '@/lib/supabase/server'
import CustomerNav from '@/components/CustomerNav'
import ThemeToggle from '@/components/ThemeToggle'
import ImageUpload from '@/components/ImageUpload'
import { Flash } from '@/components/ui'
import { logout, saveProfile } from '../actions'

export const dynamic = 'force-dynamic'

export default async function Profile({ searchParams }: { searchParams: Promise<{ ok?: string }> }) {
  const me = await getMe()
  if (!me) redirect('/login?next=/me/profil')
  const { ok } = await searchParams
  const supabase = await createClient()
  const { data: member } = await supabase.from('salon_members').select('salon_id').eq('user_id', me.id).limit(1).maybeSingle()

  return (
    <main className="mx-auto max-w-md px-5 pb-32 pt-[max(env(safe-area-inset-top),20px)]">
      <header className="rise flex items-center gap-3 pt-2">
        <h1 className="flex-1 text-[30px] font-bold tracking-tight">Profil</h1>
        <ThemeToggle />
      </header>

      <div className="mt-6"><Flash ok={ok ? 'Sparat ✓' : undefined} /></div>

      <form action={saveProfile} className="card rise grid gap-4 p-5">
        <div className="flex items-center gap-4">
          <ImageUpload name="avatar_url" folder={`u/${me.id}`} initial={me.avatar_url} size={84} />
          <div className="min-w-0">
            <div className="truncate text-lg font-semibold">{me.full_name ?? 'Ditt namn'}</div>
            <div className="truncate text-sm text-mute">{me.email}</div>
          </div>
        </div>
        <div>
          <label className="label">Namn</label>
          <input className="input" name="full_name" defaultValue={me.full_name ?? ''} autoComplete="name" />
        </div>
        <div>
          <label className="label">Telefon</label>
          <input className="input" name="phone" type="tel" defaultValue={me.phone ?? ''} autoComplete="tel" />
          <p className="mt-1.5 text-xs text-mute">Fylls i automatiskt när du bokar.</p>
        </div>
        <SubmitButton>Spara</SubmitButton>
      </form>

      <div className="card rise rise-2 mt-4 overflow-hidden">
        <Link href={member ? '/dashboard' : '/for-salonger'} className="flex items-center gap-3 px-5 py-4 transition hover:bg-fg/[0.03]">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gold-soft text-gold"><Store size={18} /></div>
          <div className="flex-1">
            <div className="font-medium">{member ? 'Min salong' : 'Driver du en salong?'}</div>
            <div className="text-sm text-mute">{member ? 'Öppna frisörpanelen' : 'Kom igång gratis'}</div>
          </div>
          <ChevronRight size={18} className="text-mute" />
        </Link>
      </div>

      <form action={logout} className="mt-4">
        <button className="btn-soft w-full text-red-400"><LogOut size={18} /> Logga ut</button>
      </form>

      <CustomerNav />
    </main>
  )
}
