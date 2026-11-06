'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const TABS = [
  { href: '/dashboard', label: 'Bokningar', icon: '📅' },
  { href: '/dashboard/services', label: 'Tjänster', icon: '✂️' },
  { href: '/dashboard/staff', label: 'Personal', icon: '👤' },
  { href: '/dashboard/settings', label: 'Salong', icon: '⚙️' },
]

export default function DashNav() {
  const path = usePathname()
  return (
    <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-ink/90 pb-[env(safe-area-inset-bottom)] backdrop-blur md:static md:border-0 md:bg-transparent md:pb-0">
      <div className="mx-auto grid max-w-3xl grid-cols-4 md:flex md:gap-2">
        {TABS.map((t) => {
          const on = path === t.href
          return (
            <Link
              key={t.href}
              href={t.href}
              className={`flex flex-col items-center gap-0.5 py-2.5 text-[11px] md:flex-row md:gap-2 md:rounded-2xl md:px-4 md:py-2 md:text-sm ${
                on ? 'text-gold md:bg-gold-soft' : 'text-mute hover:text-white'
              }`}
            >
              <span className="text-lg md:text-base">{t.icon}</span>
              {t.label}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
