'use client'

import { useEffect } from 'react'

// Visas om något oväntat går fel – istället för en tom felsida
export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => console.error(error), [error])
  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col items-center justify-center px-6 text-center">
      <div className="text-4xl">✂️</div>
      <h1 className="mt-4 text-2xl font-bold tracking-tight">Något gick snett</h1>
      <p className="mt-2 text-mute">Försök igen. Fungerar det inte, gå tillbaka till startsidan.</p>
      <div className="mt-6 grid w-full gap-3">
        <button onClick={reset} className="btn-gold">Försök igen</button>
        <a href="/" className="btn-soft">Till startsidan</a>
      </div>
      {error.digest && <p className="mt-6 text-xs text-mute">Felkod: {error.digest}</p>}
    </main>
  )
}
