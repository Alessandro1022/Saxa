'use client'

import { useEffect, useState } from 'react'
import { Ban, Flag, MoreHorizontal, Star } from 'lucide-react'
import { Avatar } from './Img'

export type ReviewItem = { id: string; rating: number; comment: string | null; date: string; who: string; avatar: string | null; author: string | null }

const HIDE = 'saxa_hidden_reviews'
const BLOCK = 'saxa_blocked_authors'
const REASONS = ['Stötande eller hatiskt', 'Spam eller reklam', 'Falskt omdöme', 'Annat']

const read = (k: string): string[] => {
  try {
    const v = JSON.parse(localStorage.getItem(k) ?? '[]')
    return Array.isArray(v) ? v : []
  } catch {
    return []
  }
}
const add = (k: string, v: string) => {
  try {
    localStorage.setItem(k, JSON.stringify([...new Set([...read(k), v])]))
  } catch {}
}

/** Omdömen med meny för att rapportera ett omdöme eller blockera den som skrev det. */
export default function ReviewList({ reviews }: { reviews: ReviewItem[] }) {
  const [hidden, setHidden] = useState<string[]>([])
  const [blocked, setBlocked] = useState<string[]>([])
  const [menu, setMenu] = useState<ReviewItem | null>(null)
  const [step, setStep] = useState<'menu' | 'reason' | 'done' | 'blocked'>('menu')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  useEffect(() => {
    setHidden(read(HIDE))
    setBlocked(read(BLOCK))
  }, [])

  const open = (r: ReviewItem) => {
    setMenu(r)
    setStep('menu')
    setErr('')
  }

  async function report(reason: string) {
    if (!menu) return
    setBusy(true)
    setErr('')
    try {
      const r = await fetch('/api/report', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ reviewId: menu.id, reason }) })
      if (!r.ok) throw new Error()
      add(HIDE, menu.id)
      setHidden(read(HIDE))
      setStep('done')
    } catch {
      setErr('Kunde inte skicka rapporten. Försök igen.')
    }
    setBusy(false)
  }

  function block() {
    if (!menu) return
    add(BLOCK, menu.author ?? `review:${menu.id}`)
    add(HIDE, menu.id)
    setBlocked(read(BLOCK))
    setHidden(read(HIDE))
    setStep('blocked')
  }

  const visible = reviews.filter((r) => !hidden.includes(r.id) && !(r.author && blocked.includes(r.author)))
  if (!visible.length && !menu) return <p className="mt-3 text-sm text-mute">Inga omdömen att visa.</p>

  return (
    <>
      <div className="no-scrollbar -mx-5 mt-3 flex gap-3 overflow-x-auto px-5">
        {visible.map((r) => (
          <div key={r.id} className="card w-[260px] shrink-0 p-4">
            <div className="flex items-center gap-2.5">
              <Avatar name={r.who} src={r.avatar} size={34} />
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium">{r.who}</div>
                <div className="flex items-center gap-1.5 text-xs text-mute">
                  <span className="flex">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} size={11} className={i < r.rating ? 'fill-gold text-gold' : 'text-mute/40'} />
                    ))}
                  </span>
                  {r.date}
                </div>
              </div>
              <button onClick={() => open(r)} className="icon-btn !h-9 !w-9" aria-label="Rapportera eller blockera">
                <MoreHorizontal size={16} />
              </button>
            </div>
            {r.comment && <p className="mt-3 line-clamp-4 text-sm leading-relaxed">{r.comment}</p>}
          </div>
        ))}
      </div>

      {menu && (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
          <div className="fade absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setMenu(null)} />
          <div className="sheet relative w-full max-w-md rounded-t-[32px] bg-ink p-5 pb-[max(env(safe-area-inset-bottom),20px)] sm:rounded-[32px]" style={{ border: '1px solid rgb(var(--line) / var(--line-a))' }}>
            {step === 'menu' && (
              <div className="grid gap-2">
                <div className="mb-1 text-lg font-bold">Omdöme från {menu.who}</div>
                <button onClick={() => setStep('reason')} className="tile flex items-center gap-3"><Flag size={18} className="text-gold" /><span><span className="block font-semibold">Rapportera omdömet</span><span className="block text-sm text-mute">Vi granskar inom 24 timmar</span></span></button>
                <button onClick={block} className="tile flex items-center gap-3"><Ban size={18} className="text-red-400" /><span><span className="block font-semibold">Blockera {menu.who}</span><span className="block text-sm text-mute">Du ser inga fler omdömen från den här personen</span></span></button>
                <button onClick={() => setMenu(null)} className="btn-soft mt-1">Avbryt</button>
              </div>
            )}
            {step === 'reason' && (
              <div className="grid gap-2">
                <div className="mb-1 text-lg font-bold">Varför rapporterar du?</div>
                {err && <p className="rounded-2xl bg-red-500/10 px-4 py-3 text-sm text-red-400">{err}</p>}
                {REASONS.map((x) => (
                  <button key={x} disabled={busy} onClick={() => report(x)} className="tile font-medium">{x}</button>
                ))}
                <button onClick={() => setMenu(null)} className="btn-soft mt-1">Avbryt</button>
              </div>
            )}
            {(step === 'done' || step === 'blocked') && (
              <div className="py-4 text-center">
                <div className="text-lg font-bold">{step === 'done' ? 'Tack för din rapport' : `${menu.who} är blockerad`}</div>
                <p className="mt-1 text-sm text-mute">
                  {step === 'done' ? 'Omdömet är dolt för dig. Vi granskar det inom 24 timmar och tar bort innehåll som bryter mot reglerna.' : 'Du ser inte längre omdömen från den här personen.'}
                </p>
                <button onClick={() => setMenu(null)} className="btn-gold mt-5 w-full">Klar</button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
