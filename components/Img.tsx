'use client'

import { useState } from 'react'
import { Scissors } from 'lucide-react'

/** Bild med snygg reserv om länken inte laddar. */
export function Cover({ src, className = '', icon = 40 }: { src?: string | null; className?: string; icon?: number }) {
  const [bad, setBad] = useState(false)
  if (src && !bad)
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt="" onError={() => setBad(true)} className={`h-full w-full object-cover ${className}`} />
  return (
    <div
      className="flex h-full w-full items-center justify-center"
      style={{ background: 'radial-gradient(circle at 30% 15%, rgb(var(--gold) / .45), rgb(var(--card)) 72%)' }}
    >
      <Scissors size={icon} className="text-gold/60" />
    </div>
  )
}

export function Avatar({ name, src, size = 48, className = '' }: { name: string; src?: string | null; size?: number; className?: string }) {
  const [bad, setBad] = useState(false)
  return (
    <div
      className={`shrink-0 overflow-hidden rounded-full ${className}`}
      style={{ width: size, height: size, background: 'linear-gradient(135deg, rgb(var(--gold) / .4), rgb(var(--gold) / .1)), rgb(var(--card))' }}
    >
      {src && !bad ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt="" onError={() => setBad(true)} className="h-full w-full object-cover" />
      ) : (
        <div className="flex h-full items-center justify-center font-semibold text-gold" style={{ fontSize: size * 0.38 }}>
          {(name?.trim()?.[0] ?? '?').toUpperCase()}
        </div>
      )}
    </div>
  )
}
