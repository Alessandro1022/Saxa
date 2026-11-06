'use client'

import { useState } from 'react'
import { Loader2 } from 'lucide-react'

export default function OnboardingForm() {
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setBusy(true)
    setErr('')
    const f = new FormData(e.currentTarget)
    try {
      const r = await fetch('/api/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(Object.fromEntries(f.entries())),
      })
      const d = await r.json().catch(() => ({ error: `Oväntat svar från servern (${r.status})` }))
      if (!r.ok || !d.ok) throw new Error(d.error ?? `Fel ${r.status}`)
      window.location.href = d.next
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Något gick fel')
      setBusy(false)
    }
  }

  return (
    <form onSubmit={submit} className="rise rise-1 grid gap-3">
      {err && <p className="fade rounded-2xl bg-red-500/10 px-4 py-3 text-sm text-red-400">{err}</p>}
      <input className="input" name="name" required placeholder="Salongens namn, t.ex. Ali's Barbershop" />
      <div className="flex items-center rounded-2xl pl-4" style={{ background: 'color-mix(in srgb, rgb(var(--fg)) 4.5%, rgb(var(--ink)))' }}>
        <span className="text-sm text-mute">saxa.se/</span>
        <input className="w-full bg-transparent px-1 py-3.5 text-[15px] outline-none placeholder:text-mute" name="slug" autoCapitalize="none" autoCorrect="off" placeholder="din-salong (valfritt)" />
      </div>
      <input className="input" name="city" placeholder="Stad, t.ex. Göteborg" />
      <input className="input" name="you" placeholder="Ditt namn (visas för kunder)" />
      <button type="submit" className="btn-gold mt-2" disabled={busy}>
        {busy ? <><Loader2 size={18} className="animate-spin" /> Skapar salong…</> : 'Skapa salong'}
      </button>
    </form>
  )
}
