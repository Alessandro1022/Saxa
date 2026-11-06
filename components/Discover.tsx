'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { ChevronRight, MapPin, Search, Scissors } from 'lucide-react'
import { Avatar, Rating } from './ui'
import { Cover } from './Img'

export type SalonCard = {
  id: string
  slug: string
  name: string
  city: string | null
  address: string | null
  cover_url: string | null
  logo_url: string | null
  rating: number | null
  reviews: number
  from: number | null
  staff: { id: string; name: string; photo_url: string | null }[]
}
export type Pro = {
  id: string
  name: string
  title: string | null
  photo_url: string | null
  salon: { slug: string; name: string; city: string | null }
  rating: number | null
  reviews: number
}

const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')

export default function Discover({ salons, pros }: { salons: SalonCard[]; pros: Pro[] }) {
  const [q, setQ] = useState('')
  const [city, setCity] = useState('')
  const [tab, setTab] = useState<'salons' | 'pros'>('salons')

  const cities = useMemo(() => [...new Set(salons.map((s) => s.city).filter(Boolean) as string[])].sort(), [salons])
  const match = (...f: (string | null | undefined)[]) => norm(f.filter(Boolean).join(' ')).includes(norm(q))

  const s = salons.filter((x) => (!city || x.city === city) && match(x.name, x.city, x.address))
  const p = pros.filter((x) => (!city || x.salon.city === city) && match(x.name, x.title, x.salon.name, x.salon.city))

  return (
    <>
      <div className="rise rise-2 sticky top-3 z-20 mt-6">
        <label className="glass flex items-center gap-3 rounded-full px-5 py-3.5">
          <Search size={18} className="text-mute" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Sök salong, frisör eller stad"
            className="w-full bg-transparent text-[15px] outline-none placeholder:text-mute"
          />
        </label>
      </div>

      <div className="rise rise-3 mt-5 flex items-center gap-2">
        <div className="flex rounded-full p-1" style={{ background: 'rgb(var(--fg) / .05)' }}>
          {(
            [
              ['salons', `Salonger · ${s.length}`],
              ['pros', `Frisörer · ${p.length}`],
            ] as const
          ).map(([k, l]) => (
            <button
              key={k}
              onClick={() => setTab(k)}
              className={`rounded-full px-4 py-2 text-sm font-medium transition duration-300 ${tab === k ? 'bg-fg text-ink' : 'text-mute'}`}
            >
              {l}
            </button>
          ))}
        </div>
      </div>

      {cities.length > 1 && (
        <div className="no-scrollbar -mx-5 mt-3 flex gap-2 overflow-x-auto px-5">
          <button onClick={() => setCity('')} className={`pill shrink-0 ${!city ? 'pill-on' : ''}`}>Alla</button>
          {cities.map((c) => (
            <button key={c} onClick={() => setCity(c)} className={`pill shrink-0 ${city === c ? 'pill-on' : ''}`}>{c}</button>
          ))}
        </div>
      )}

      <div className="mt-5">
        {tab === 'salons' ? (
          s.length ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {s.map((x, i) => (
                <Link key={x.id} href={`/${x.slug}`} className="rise group block" style={{ animationDelay: `${0.04 * i + 0.15}s` }}>
                  <div className="relative h-44 overflow-hidden rounded-[28px]">
                    <Cover src={x.cover_url} className="transition duration-700 group-hover:scale-105" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />
                    {x.from != null && (
                      <span className="absolute right-3 top-3 rounded-full bg-black/45 px-3 py-1 text-xs font-medium text-white backdrop-blur-md">
                        från {x.from} kr
                      </span>
                    )}
                    <div className="absolute inset-x-4 bottom-4 flex items-end gap-3 text-white">
                      <Avatar name={x.name} src={x.logo_url} size={46} className="ring-2 ring-white/30" />
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-lg font-semibold leading-tight">{x.name}</div>
                        <div className="flex items-center gap-1 text-[13px] text-white/75">
                          <MapPin size={13} />
                          <span className="truncate">{x.city ?? x.address ?? 'Sverige'}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between px-2 pt-2.5">
                    <Rating avg={x.rating} n={x.reviews} />
                    <div className="flex -space-x-2">
                      {x.staff.slice(0, 4).map((t) => (
                        <Avatar key={t.id} name={t.name} src={t.photo_url} size={26} className="ring-2 ring-[rgb(var(--ink))]" />
                      ))}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <Empty />
          )
        ) : p.length ? (
          <div className="card divide-hair overflow-hidden">
            {p.map((x) => (
              <Link key={x.id} href={`/${x.salon.slug}?staff=${x.id}`} className="flex items-center gap-4 px-4 py-3.5 transition hover:bg-fg/[0.03]">
                <Avatar name={x.name} src={x.photo_url} size={56} />
                <div className="min-w-0 flex-1">
                  <div className="font-semibold">{x.name}</div>
                  <div className="truncate text-sm text-mute">
                    {x.title ?? 'Frisör'} · {x.salon.name}
                  </div>
                  <Rating avg={x.rating} n={x.reviews} className="mt-0.5" />
                </div>
                <ChevronRight size={18} className="text-mute" />
              </Link>
            ))}
          </div>
        ) : (
          <Empty />
        )}
      </div>
    </>
  )
}

function Empty() {
  return (
    <div className="card px-6 py-12 text-center">
      <Scissors className="mx-auto text-gold" />
      <p className="mt-3 font-medium">Inget hittades</p>
      <p className="text-sm text-mute">Testa en annan sökning eller stad.</p>
    </div>
  )
}
