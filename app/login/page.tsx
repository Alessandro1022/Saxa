'use client'

import { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import ThemeToggle from '@/components/ThemeToggle'
import { Logo } from '@/components/ui'

function LoginInner() {
  const router = useRouter()
  const sp = useSearchParams()
  const [as, setAs] = useState<'customer' | 'salon'>(sp.get('as') === 'salon' ? 'salon' : 'customer')
  const [mode, setMode] = useState<'in' | 'up'>(sp.get('mode') === 'up' ? 'up' : 'in')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [msg, setMsg] = useState('')
  const [busy, setBusy] = useState(false)

  const next = sp.get('next')
  const dest = next?.startsWith('/') ? next : as === 'salon' ? '/dashboard' : '/me'

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setMsg('')
    try {
      const supabase = createClient()
      if (mode === 'in') {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw new Error('Fel e-post eller lösenord.')
        router.push(dest)
        router.refresh()
      } else {
        const after = as === 'salon' ? '/onboarding' : dest
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: name },
            emailRedirectTo: `${location.origin}/auth/callback?next=${encodeURIComponent(after)}`,
          },
        })
        if (error) throw new Error(error.message)
        if (data.session) {
          router.push(after)
          router.refresh()
        } else {
          setMsg('Klart! Kolla din mejl och klicka på länken för att aktivera kontot.')
          setBusy(false)
        }
      }
    } catch (err) {
      setMsg(
        !process.env.NEXT_PUBLIC_SUPABASE_URL
          ? 'Supabase-nycklarna saknas. Lägg in dem i Vercel och gör Redeploy.'
          : err instanceof Error
            ? err.message
            : 'Något gick fel'
      )
      setBusy(false)
    }
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col px-6 pb-10 pt-6">
      <div className="flex items-center justify-between">
        <Link href="/" className="icon-btn" aria-label="Tillbaka"><ArrowLeft size={18} /></Link>
        <ThemeToggle />
      </div>

      <div className="rise flex flex-1 flex-col justify-center py-10">
        <Logo size={52} />
        <h1 className="mt-6 text-3xl font-bold tracking-tight">{mode === 'in' ? 'Välkommen tillbaka' : 'Skapa konto'}</h1>
        <p className="mt-1.5 text-mute">{as === 'salon' ? 'För salonger och frisörer.' : 'Se och hantera alla dina bokningar.'}</p>

        <div className="mt-7 grid grid-cols-2 rounded-full p-1" style={{ background: 'color-mix(in srgb, rgb(var(--fg)) 5%, rgb(var(--ink)))' }}>
          {(
            [
              ['customer', 'Kund'],
              ['salon', 'Salong'],
            ] as const
          ).map(([k, l]) => (
            <button
              key={k}
              type="button"
              onClick={() => setAs(k)}
              className={`rounded-full py-2.5 text-sm font-medium transition duration-300 ${as === k ? 'bg-fg text-ink' : 'text-mute'}`}
            >
              {l}
            </button>
          ))}
        </div>

        <form onSubmit={submit} className="mt-5 grid gap-3">
          {mode === 'up' && (
            <input className="input" required placeholder="Ditt namn" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} />
          )}
          <input className="input" type="email" required placeholder="E-post" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <input
            className="input"
            type="password"
            required
            minLength={6}
            placeholder="Lösenord (minst 6 tecken)"
            autoComplete={mode === 'in' ? 'current-password' : 'new-password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button className="btn-gold mt-2" disabled={busy}>
            {busy ? 'Vänta…' : mode === 'in' ? 'Logga in' : 'Skapa konto'}
          </button>
        </form>
        {msg && <p className="fade mt-4 rounded-2xl bg-gold-soft px-4 py-3 text-sm text-gold">{msg}</p>}

        {mode === 'up' && (
          <p className="mt-4 text-center text-xs text-mute">
            Genom att skapa konto godkänner du vår <Link href="/integritet" className="underline">integritetspolicy</Link>.
          </p>
        )}
        <button
          onClick={() => {
            setMode(mode === 'in' ? 'up' : 'in')
            setMsg('')
          }}
          className="mt-6 text-sm text-mute transition hover:text-fg"
        >
          {mode === 'in' ? 'Inget konto? ' : 'Har du redan konto? '}
          <span className="font-semibold text-gold">{mode === 'in' ? 'Skapa ett' : 'Logga in'}</span>
        </button>
      </div>
    </main>
  )
}

export default function Login() {
  return (
    <Suspense>
      <LoginInner />
    </Suspense>
  )
}
