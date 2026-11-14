'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { ChevronRight, Scissors } from 'lucide-react'
import { deviceTokens } from './BookingKeeper'

type Info = { token: string; ref: string; starts_at: string; status: string; service: string; salon: string; staff: string | null; payment_status: string | null; due_sek: number | null }

const fmt = (iso: string) =>
  new Date(iso).toLocaleString('sv-SE', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Stockholm' })

/** Bokningar gjorda på den här enheten – för den som bokat utan konto. */
export default function GuestBookings() {
  const [list, setList] = useState<Info[] | null>(null)

  useEffect(() => {
    const tokens = deviceTokens()
    Promise.all(
      tokens.map((t) =>
        fetch(`/api/booking-info/${t}`)
          .then((r) => (r.ok ? r.json() : null))
          .then((d) => (d ? { ...d, token: t } : null))
          .catch(() => null)
      )
    ).then((rows) => setList((rows.filter(Boolean) as Info[]).sort((a, b) => b.starts_at.localeCompare(a.starts_at))))
  }, [])

  if (list === null)
    return (
      <div className="grid gap-3">
        {[0, 1].map((i) => (
          <div key={i} className="h-20 animate-pulse rounded-[28px]" style={{ background: 'color-mix(in srgb, rgb(var(--fg)) 6%, rgb(var(--ink)))' }} />
        ))}
      </div>
    )

  if (list.length === 0)
    return (
      <div className="card px-6 py-10 text-center">
        <Scissors className="mx-auto text-gold" />
        <p className="mt-3 font-medium">Inga bokningar på den här enheten</p>
        <Link href="/frisorer" className="btn-gold mt-5 !py-3">Hitta en frisör</Link>
      </div>
    )

  const now = Date.now()
  return (
    <div className="card divide-hair overflow-hidden">
      {list.map((b) => {
        const past = Date.parse(b.starts_at) < now
        const cancelled = b.status !== 'confirmed' && b.status !== 'no_show'
        return (
          <Link key={b.token} href={`/b/${b.token}`} className={`flex items-center gap-3 px-4 py-4 ${past || cancelled ? 'opacity-60' : ''}`}>
            <div className="min-w-0 flex-1">
              <div className="font-semibold capitalize">{fmt(b.starts_at)}</div>
              <div className="truncate text-sm text-mute">
                {b.service} · {b.salon}
                {b.staff ? ` · ${b.staff}` : ''}
              </div>
              <div className="mt-1 flex flex-wrap gap-1.5 text-[11px] font-medium">
                <span className="rounded-full px-2 py-0.5 text-mute" style={{ background: 'color-mix(in srgb, rgb(var(--fg)) 7%, rgb(var(--ink)))' }}>{b.ref}</span>
                {cancelled ? (
                  <span className="rounded-full bg-red-500/15 px-2 py-0.5 text-red-400">Avbokad</span>
                ) : b.payment_status === 'awaiting' ? (
                  <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-amber-500">Swisha {b.due_sek} kr</span>
                ) : (
                  <span className="rounded-full bg-gold-soft px-2 py-0.5 text-gold">{past ? 'Genomförd' : 'Bokad'}</span>
                )}
              </div>
            </div>
            <ChevronRight size={18} className="text-mute" />
          </Link>
        )
      })}
    </div>
  )
}
