'use client'

import { useState } from 'react'
import { Loader2, Trash2 } from 'lucide-react'

export default function DeleteAccount() {
  const [step, setStep] = useState(0)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  async function del() {
    setBusy(true)
    setErr('')
    const r = await fetch('/api/account', { method: 'DELETE' })
    if (r.ok) {
      window.location.href = '/?raderad=1'
      return
    }
    const d = await r.json().catch(() => ({}))
    setErr(d.error ?? 'Kunde inte radera kontot')
    setBusy(false)
  }

  if (step === 0)
    return (
      <button onClick={() => setStep(1)} className="mx-auto mt-6 flex items-center gap-1.5 text-sm text-mute hover:text-red-400">
        <Trash2 size={14} /> Radera konto
      </button>
    )

  return (
    <div className="card fade mt-4 p-5">
      <div className="font-semibold">Radera ditt konto?</div>
      <p className="mt-1 text-sm text-mute">Din profil och dina omdömen raderas och kommande bokningar avbokas. Det går inte att ångra.</p>
      {err && <p className="mt-3 rounded-2xl bg-red-500/10 px-4 py-3 text-sm text-red-400">{err}</p>}
      <div className="mt-4 grid grid-cols-2 gap-2">
        <button onClick={() => setStep(0)} className="btn-soft !py-3">Avbryt</button>
        <button onClick={del} disabled={busy} className="btn !py-3 bg-red-500 text-white">
          {busy ? <Loader2 size={18} className="animate-spin" /> : 'Radera'}
        </button>
      </div>
    </div>
  )
}
