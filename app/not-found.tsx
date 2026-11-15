import Link from 'next/link'

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col items-center justify-center px-6 text-center">
      <div className="text-4xl">✂️</div>
      <h1 className="mt-4 text-2xl font-bold tracking-tight">Sidan finns inte</h1>
      <p className="mt-2 text-mute">Salongen kan ha bytt länk eller tagits bort.</p>
      <div className="mt-6 grid w-full gap-3">
        <Link href="/frisorer" className="btn-gold">Hitta frisör</Link>
        <Link href="/" className="btn-soft">Till startsidan</Link>
      </div>
    </main>
  )
}
