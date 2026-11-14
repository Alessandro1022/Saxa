'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { CalendarDays, Home, Search, UserRound } from 'lucide-react'

const TABS = [
  { href: '/', label: 'Hem', Icon: Home },
  { href: '/frisorer', label: 'Hitta', Icon: Search },
  { href: '/me', label: 'Bokningar', Icon: CalendarDays },
  { href: '/me/profil', label: 'Profil', Icon: UserRound },
]

export default function CustomerNav() {
  const path = usePathname()
  return (
    <nav className="web-only fixed inset-x-0 bottom-0 z-30 flex justify-center px-5 pb-[max(env(safe-area-inset-bottom),16px)]">
      <div className="glass flex gap-1 rounded-full p-1.5">
        {TABS.map(({ href, label, Icon }) => {
          const on = path === href
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium transition duration-300 ${on ? 'bg-gold text-ongold' : 'text-mute hover:text-fg'}`}
            >
              <Icon size={18} strokeWidth={on ? 2.4 : 2} />
              <span className={on ? '' : 'hidden sm:inline'}>{label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
