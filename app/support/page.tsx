import Link from 'next/link'
import { ArrowLeft, Mail } from 'lucide-react'
import ThemeToggle from '@/components/ThemeToggle'

export const metadata = { title: 'Support – Saxa' }

const FAQ = [
  ['Hur avbokar jag?', 'Öppna länken i din bokningsbekräftelse, eller gå till Bokningar i appen och tryck på krysset.'],
  ['Behöver jag ett konto för att boka?', 'Nej. Namn, telefon och e-post räcker. Med konto samlas alla dina bokningar på ett ställe.'],
  ['Hur raderar jag mitt konto?', 'Gå till Profil → Radera konto. Allt raderas direkt.'],
  ['Jag driver en salong – hur kommer jag igång?', 'Gå till Logga in → Salong → Skapa konto. Du är bokningsbar på en minut.'],
]

export default function Support() {
  return (
    <main className="mx-auto max-w-2xl px-5 pb-24 pt-[max(env(safe-area-inset-top),20px)]">
      <header className="flex items-center gap-3 pt-2">
        <Link href="/" className="icon-btn" aria-label="Tillbaka"><ArrowLeft size={18} /></Link>
        <div className="flex-1" />
        <ThemeToggle />
      </header>
      <h1 className="mt-6 text-[30px] font-bold tracking-tight">Support</h1>
      <p className="mt-1 text-mute">Vi svarar oftast inom ett dygn.</p>
      <a href="mailto:wehelie@aetossystems.se" className="btn-gold mt-6 w-full sm:w-auto"><Mail size={18} /> wehelie@aetossystems.se</a>
      <div className="card divide-hair mt-8 overflow-hidden">
        {FAQ.map(([q, a]) => (
          <div key={q} className="px-5 py-4">
            <div className="font-semibold">{q}</div>
            <div className="mt-1 text-sm text-mute">{a}</div>
          </div>
        ))}
      </div>
      <Link href="/integritet" className="mt-6 block text-center text-sm text-mute hover:text-fg">Integritetspolicy</Link>
    </main>
  )
}
