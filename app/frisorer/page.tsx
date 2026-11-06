import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { loadDiscover } from '@/lib/discover'
import { getMe } from '@/lib/user'
import Discover from '@/components/Discover'
import CustomerNav from '@/components/CustomerNav'
import ThemeToggle from '@/components/ThemeToggle'
import { Avatar } from '@/components/ui'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Hitta frisör – Saxa' }

export default async function FindPage() {
  const [{ salons, pros }, me] = await Promise.all([loadDiscover(), getMe()])
  return (
    <main className="mx-auto max-w-2xl px-5 pb-32 pt-[max(env(safe-area-inset-top),20px)]">
      <header className="rise flex items-center gap-3 pt-2">
        <Link href="/" className="icon-btn" aria-label="Hem"><ArrowLeft size={18} /></Link>
        <h1 className="flex-1 whitespace-nowrap text-2xl font-bold tracking-tight">Hitta frisör</h1>
        <ThemeToggle />
        {me ? (
          <Link href="/me/profil"><Avatar name={me.full_name ?? me.email} src={me.avatar_url} size={44} /></Link>
        ) : (
          <Link href="/login" className="btn-soft !px-4 !py-2.5 text-sm">Logga in</Link>
        )}
      </header>
      <Discover salons={salons} pros={pros} />
      <CustomerNav />
    </main>
  )
}
