'use client'

import { useEffect, useState } from 'react'
import { Plus, X } from 'lucide-react'

/** Flytande +-knapp som öppnar ett bottenark (mobil) / modal (desktop). */
export default function Sheet({ title, children, defaultOpen = false }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen)
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-[calc(max(env(safe-area-inset-bottom),16px)+76px)] right-5 z-30 flex h-14 w-14 items-center justify-center rounded-full text-ongold transition active:scale-90"
        style={{ background: 'linear-gradient(160deg,#f3dfa9,#c99d4a)', boxShadow: '0 16px 36px -12px rgb(210 171 92 / .9)' }}
        aria-label={title}
      >
        <Plus size={26} strokeWidth={2.6} />
      </button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
          <div className="fade absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="sheet relative max-h-[92dvh] w-full max-w-lg overflow-y-auto rounded-t-[32px] bg-ink p-5 pb-[max(env(safe-area-inset-bottom),20px)] sm:rounded-[32px]" style={{ border: '1px solid rgb(var(--line) / var(--line-a))' }}>
            <div className="mx-auto mb-4 h-1.5 w-10 rounded-full sm:hidden" style={{ background: 'color-mix(in srgb, rgb(var(--fg)) 15%, rgb(var(--ink)))' }} />
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-bold">{title}</h2>
              <button onClick={() => setOpen(false)} className="icon-btn" aria-label="Stäng"><X size={18} /></button>
            </div>
            {children}
          </div>
        </div>
      )}
    </>
  )
}
