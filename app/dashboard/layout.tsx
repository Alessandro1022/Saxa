import Link from 'next/link'
import { ExternalLink, LogOut } from 'lucide-react'
import DashNav from '@/components/DashNav'
import ThemeToggle from '@/components/ThemeToggle'
import { Avatar } from '@/components/ui'
import { requireSalon } from '@/lib/salon'
import { signOut } from './actions'

export const dynamic = 'force-dynamic'

export default async function DashLayout({ children }: { children: React.ReactNode }) {
  const { salon } = await requireSalon()
  return (
    <div className="mx-auto min-h-dvh max-w-2xl px-5 pb-40 pt-[max(env(safe-area-inset-top),20px)]">
      <header className="rise flex items-center gap-3 pb-6 pt-2">
        <Avatar name={salon.name} src={salon.logo_url} size={44} />
        <div className="min-w-0 flex-1">
          <div className="truncate font-semibold leading-tight">{salon.name}</div>
          <Link href={`/${salon.slug}`} target="_blank" className="inline-flex items-center gap-1 text-xs text-mute hover:text-gold">
            Visa bokningssida <ExternalLink size={11} />
          </Link>
        </div>
        <ThemeToggle />
        <form action={signOut}>
          <button className="icon-btn" aria-label="Logga ut"><LogOut size={17} /></button>
        </form>
      </header>
      {children}
      <DashNav />
    </div>
  )
}
