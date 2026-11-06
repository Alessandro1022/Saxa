'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function Login() {
  const router = useRouter()
  const [mode, setMode] = useState<'in' | 'up'>('in')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [msg, setMsg] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setMsg('')
    try {
      await run()
    } catch (err) {
      console.error(err)
      setMsg(
        !process.env.NEXT_PUBLIC_SUPABASE_URL
          ? 'Supabase-nycklarna saknas i Vercel. Lägg in dem och gör Redeploy.'
          : 'Kunde inte nå servern. Försök igen.'
      )
      setBusy(false)
    }
  }

  async function run() {
    const supabase = createClient()
    if (mode === 'in') {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) {
        setMsg('Fel e-post eller lösenord.')
        setBusy(false)
        return
      }
      router.push('/dashboard')
      router.refresh()
    } else {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: `${location.origin}/auth/callback?next=/onboarding` },
      })
      setBusy(false)
      if (error) return setMsg(error.message)
      if (data.session) {
        router.push('/onboarding')
        router.refresh()
      } else setMsg('Kolla din mejl och klicka på länken för att aktivera kontot.')
    }
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center px-6">
      <Link href="/" className="mb-8 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gold text-xl font-black text-ongold">S</Link>
      <h1 className="text-3xl font-bold">{mode === 'in' ? 'Logga in' : 'Skapa konto'}</h1>
      <p className="mt-2 text-mute">För salonger och frisörer.</p>
      <form onSubmit={submit} className="mt-8 grid gap-3">
        <input className="input" type="email" required placeholder="E-post" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <input className="input" type="password" required minLength={6} placeholder="Lösenord" autoComplete={mode === 'in' ? 'current-password' : 'new-password'} value={password} onChange={(e) => setPassword(e.target.value)} />
        <button className="btn-gold mt-2" disabled={busy}>{busy ? 'Vänta…' : mode === 'in' ? 'Logga in' : 'Skapa konto'}</button>
      </form>
      {msg && <p className="mt-4 text-sm text-gold">{msg}</p>}
      <button onClick={() => { setMode(mode === 'in' ? 'up' : 'in'); setMsg('') }} className="mt-6 text-sm text-mute underline-offset-4 hover:underline">
        {mode === 'in' ? 'Ny salong? Skapa konto' : 'Har du redan konto? Logga in'}
      </button>
    </main>
  )
}
