import Link from 'next/link'

export default function Home() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-6 py-16">
      <div className="rise">
        <div className="mb-8 inline-flex h-14 w-14 items-center justify-center rounded-3xl bg-gold text-2xl font-black text-ink">S</div>
        <h1 className="text-4xl font-bold tracking-tight">Bokning som bara funkar.</h1>
        <p className="mt-4 text-lg text-mute">
          En länk i bion. Kunderna bokar själva, du ser allt i din kalender. Ingen provision.
        </p>
        <div className="mt-10 grid gap-3">
          <Link href="/login" className="btn-gold">Kom igång för salongen</Link>
          <Link href="/demo" className="btn-ghost">Se en demo-bokning</Link>
        </div>
        <ul className="mt-10 space-y-2 text-sm text-mute">
          <li>✓ Bokas i Google- och Apple-kalendern direkt</li>
          <li>✓ Lägg in DM- och telefonbokningar på sekunder</li>
          <li>✓ Kunden kan själv avboka – färre no-shows</li>
        </ul>
      </div>
    </main>
  )
}
