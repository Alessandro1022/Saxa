'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { CalendarDays, Scissors, Store, Users } from 'lucide-react'

const TABS = [
  { href: '/dashboard', label: 'Bokningar', Icon: CalendarDays },
  { href: '/dashboard/services', label: 'Tjänster', Icon: Scissors },
  { href: '/dashboard/staff', label: 'Team', Icon: Users },
  { href: '/dashboard/settings', label: 'Salong', Icon: Store },
]

export default function DashNav() {
  const path = usePathname()
  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 flex justify-center px-4 pb-[max(env(safe-area-inset-bottom),16px)]">
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
