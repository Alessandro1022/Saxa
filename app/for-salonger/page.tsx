import Link from 'next/link'
import { CalendarCheck, MessageCircle, Smartphone, Star, UserX, Zap } from 'lucide-react'
import ThemeToggle from '@/components/ThemeToggle'
import { Logo } from '@/components/ui'

const FEATURES = [
  { Icon: Smartphone, t: 'En länk i bion', d: 'Kunderna bokar själva dygnet runt – ingen app krävs.' },
  { Icon: CalendarCheck, t: 'Din kalender', d: 'Bokningar landar i Google- och Apple-kalendern.' },
  { Icon: MessageCircle, t: 'DM-bokningar', d: 'Lägg in DM och telefonbokningar på två sekunder.' },
  { Icon: UserX, t: 'Färre no-shows', d: 'Kunden kan avboka själv – tiden blir ledig direkt.' },
  { Icon: Star, t: 'Omdömen', d: 'Nöjda kunder lämnar betyg som syns för nya kunder.' },
  { Icon: Zap, t: 'Igång på 1 minut', d: 'Tre fält, sen är du bokningsbar.' },
]

export default function ForSalons() {
  return (
    <main className="mx-auto max-w-2xl px-5 pb-20 pt-6">
      <header className="flex items-center gap-3">
        <Link href="/"><Logo size={40} /></Link>
        <div className="flex-1" />
        <ThemeToggle />
        <Link href="/login?as=salon" className="btn-soft !px-5 !py-2.5 text-sm">Logga in</Link>
      </header>

      <section className="rise mt-14">
        <span className="pill text-gold">Ingen provision · från 59 kr/mån</span>
        <h1 className="mt-5 text-[42px] font-bold leading-[1.05] tracking-tight">
          Bokning som <span className="gold-text">bara funkar.</span>
        </h1>
        <p className="mt-4 max-w-md text-lg text-mute">Fyll stolen, slipp DM-kaoset och se hela dagen i telefonen.</p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/login?as=salon&mode=up" className="btn-gold">Skapa salong gratis</Link>
          <Link href="/demo" className="btn-soft">Se demo</Link>
        </div>
      </section>

      <section className="mt-14 grid gap-3 sm:grid-cols-2">
        {FEATURES.map(({ Icon, t, d }, i) => (
          <div key={t} className="card rise p-5" style={{ animationDelay: `${0.05 * i + 0.1}s` }}>
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gold-soft text-gold">
              <Icon size={20} />
            </div>
            <div className="mt-4 font-semibold">{t}</div>
            <div className="mt-1 text-sm text-mute">{d}</div>
          </div>
        ))}
      </section>
    </main>
  )
}
