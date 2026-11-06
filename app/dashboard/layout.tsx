import Link from 'next/link'
import DashNav from '@/components/DashNav'
import { requireSalon } from '@/lib/salon'
import { signOut } from './actions'

export const dynamic = 'force-dynamic'

export default async function DashLayout({ children }: { children: React.ReactNode }) {
  const { salon } = await requireSalon()
  return (
    <div className="mx-auto min-h-dvh max-w-3xl px-5 pb-28 pt-6 md:pb-10">
      <header className="mb-6 flex items-center gap-3 pr-12">
        <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-2xl bg-gold font-black text-ongold">
          {salon.logo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={salon.logo_url} alt="" className="h-full w-full object-cover" />
          ) : (
            salon.name[0]
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate font-semibold">{salon.name}</div>
          <Link href={`/${salon.slug}`} target="_blank" className="text-xs text-mute hover:text-gold">
            /{salon.slug} ↗
          </Link>
        </div>
        <form action={signOut}>
          <button className="text-xs text-mute hover:text-fg">Logga ut</button>
        </form>
      </header>
      <div className="mb-6 hidden md:block">
        <DashNav />
      </div>
      {children}
      <div className="md:hidden">
        <DashNav />
      </div>
    </div>
  )
}
