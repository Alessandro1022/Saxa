'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Clock, Sparkles } from 'lucide-react'
import { addDays, prettyDate, todayIn, WEEKDAYS, weekdayOf, MONTHS, type Slot } from '@/lib/time'
import { Avatar, Rating } from './ui'

type Staff = { id: string; name: string; title: string | null; bio: string | null; photo_url: string | null; rating?: { avg: number; n: number } | null }
type Service = { id: string; name: string; description: string | null; duration_min: number; price_sek: number | null }

const DAYS = 30
const STEPS = ['Tjänst', 'Frisör', 'Tid', 'Klart']

export default function BookingFlow({
  salonId,
  tz,
  staff,
  services,
  initialStaff,
  me,
}: {
  salonId: string
  tz: string
  staff: Staff[]
  services: Service[]
  initialStaff?: string
  me: { name: string; phone: string; email: string } | null
}) {
  const router = useRouter()
  const preset = initialStaff ?? (staff.length === 1 ? staff[0].id : '')
  const [step, setStep] = useState(1)
  const [service, setService] = useState<Service | null>(null)
  const [staffId, setStaffId] = useState(preset)
  const today = useMemo(() => todayIn(tz), [tz])
  const [date, setDate] = useState(today)
  const [slots, setSlots] = useState<Slot[] | null>(null)
  const [time, setTime] = useState('')
  const [form, setForm] = useState({ name: me?.name ?? '', phone: me?.phone ?? '', email: me?.email ?? '', note: '' })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const days = useMemo(() => Array.from({ length: DAYS }, (_, i) => addDays(today, i)), [today])
  const chosen = staff.find((s) => s.id === staffId)
  const staffName = staffId === 'any' ? 'Första lediga' : chosen?.name

  useEffect(() => {
    if (step !== 3 || !service || !staffId) return
    setSlots(null)
    const ctrl = new AbortController()
    fetch(`/api/slots?salon=${salonId}&service=${service.id}&staff=${staffId}&date=${date}`, { signal: ctrl.signal })
      .then((r) => r.json())
      .then((d) => setSlots(d.slots ?? []))
      .catch(() => {})
    return () => ctrl.abort()
  }, [step, service, staffId, date, salonId])

  function go(n: number) {
    setError('')
    setStep(n)
    document.getElementById('boka')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
  function back() {
    if (step === 3 && preset) return go(1)
    go(step - 1)
  }

  async function submit() {
    setBusy(true)
    setError('')
    try {
      const r = await fetch('/api/book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ salonId, serviceId: service?.id, staffId, date, time, ...form }),
      })
      const d = await r.json()
      if (!r.ok) {
        setError(d.error ?? 'Något gick fel')
        if (r.status === 409) setStep(3)
        setBusy(false)
        return
      }
      router.push(`/b/${d.token}`)
    } catch {
      setError('Kunde inte nå servern')
      setBusy(false)
    }
  }

  const [, mo] = date.split('-').map(Number)

  return (
    <section className="mt-10 px-5">
      <div className="flex items-center gap-3">
        {step > 1 && (
          <button onClick={back} className="icon-btn" aria-label="Tillbaka"><ArrowLeft size={18} /></button>
        )}
        <div className="flex-1">
          <div className="text-xs font-medium uppercase tracking-wider text-gold">Steg {step} av 4</div>
          <h2 className="text-xl font-bold tracking-tight">
            {['Välj tjänst', 'Välj frisör', 'Välj tid', 'Nästan klart'][step - 1]}
          </h2>
        </div>
      </div>
      <div className="mt-4 grid grid-cols-4 gap-1.5">
        {STEPS.map((s, i) => (
          <div key={s} className="h-1 overflow-hidden rounded-full" style={{ background: 'rgb(var(--fg) / .08)' }}>
            <div className="h-full rounded-full bg-gold transition-all duration-500" style={{ width: step > i ? '100%' : '0%' }} />
          </div>
        ))}
      </div>

      {error && <p className="fade mt-4 rounded-2xl bg-red-500/10 px-4 py-3 text-sm text-red-400">{error}</p>}

      <div key={step} className="rise mt-5">
        {step === 1 && (
          <div className="grid gap-2.5">
            {services.map((s) => (
              <button
                key={s.id}
                className={`tile flex items-center gap-4 ${service?.id === s.id ? 'tile-on' : ''}`}
                onClick={() => {
                  setService(s)
                  go(preset ? 3 : 2)
                }}
              >
                <div className="min-w-0 flex-1">
                  <div className="font-semibold">{s.name}</div>
                  <div className="mt-0.5 flex items-center gap-1 text-sm text-mute">
                    <Clock size={13} /> {s.duration_min} min{s.description ? ` · ${s.description}` : ''}
                  </div>
                </div>
                {s.price_sek != null && <div className="rounded-full bg-gold-soft px-3 py-1.5 text-sm font-semibold text-gold">{s.price_sek} kr</div>}
              </button>
            ))}
          </div>
        )}

        {step === 2 && (
          <div className="grid gap-2.5">
            <button className={`tile flex items-center gap-4 ${staffId === 'any' ? 'tile-on' : ''}`} onClick={() => { setStaffId('any'); go(3) }}>
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gold-soft text-gold"><Sparkles size={22} /></div>
              <div>
                <div className="font-semibold">Första lediga</div>
                <div className="text-sm text-mute">Flest tider att välja på</div>
              </div>
            </button>
            {staff.map((s) => (
              <button key={s.id} className={`tile flex items-center gap-4 ${staffId === s.id ? 'tile-on' : ''}`} onClick={() => { setStaffId(s.id); go(3) }}>
                <Avatar name={s.name} src={s.photo_url} size={56} />
                <div className="min-w-0 flex-1">
                  <div className="font-semibold">{s.name}</div>
                  <div className="truncate text-sm text-mute">{s.bio || s.title || 'Frisör'}</div>
                </div>
                <Rating avg={s.rating?.avg} n={s.rating?.n} />
              </button>
            ))}
          </div>
        )}

        {step === 3 && (
          <div>
            <div className="mb-2 text-sm font-medium capitalize text-mute">{MONTHS[mo - 1]}</div>
            <div className="no-scrollbar -mx-5 flex gap-2 overflow-x-auto px-5 pb-1">
              {days.map((d) => {
                const on = d === date
                return (
                  <button
                    key={d}
                    onClick={() => { setDate(d); setTime('') }}
                    className={`flex h-[78px] w-[58px] shrink-0 flex-col items-center justify-center rounded-[22px] transition duration-300 ${on ? 'bg-gold text-ongold shadow-[0_10px_24px_-10px_rgb(210_171_92/.9)]' : 'hover:bg-fg/[0.08]'}`}
                    style={on ? undefined : { background: 'rgb(var(--fg) / .045)' }}
                  >
                    <span className={`text-[11px] font-medium uppercase ${on ? '' : 'text-mute'}`}>{d === today ? 'Idag' : WEEKDAYS[weekdayOf(d)]}</span>
                    <span className="text-xl font-bold">{Number(d.slice(8))}</span>
                  </button>
                )
              })}
            </div>
            <div className="mt-5 min-h-[150px]">
              {slots === null ? (
                <div className="grid grid-cols-4 gap-2">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="h-12 animate-pulse rounded-full" style={{ background: 'rgb(var(--fg) / .05)' }} />
                  ))}
                </div>
              ) : slots.length === 0 ? (
                <div className="rounded-[24px] px-6 py-10 text-center" style={{ background: 'rgb(var(--fg) / .04)' }}>
                  <p className="font-medium">Fullbokat den här dagen</p>
                  <p className="text-sm text-mute">Svep och testa en annan dag.</p>
                </div>
              ) : (
                <div className="grid grid-cols-4 gap-2">
                  {slots.map((s) => (
                    <button
                      key={s.time}
                      onClick={() => { setTime(s.time); go(4) }}
                      className={`h-12 rounded-full text-[15px] font-semibold transition duration-200 active:scale-95 ${time === s.time ? 'bg-gold text-ongold' : 'hover:bg-fg/[0.1]'}`}
                      style={time === s.time ? undefined : { background: 'rgb(var(--fg) / .05)' }}
                    >
                      {s.time}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {step === 4 && service && (
          <form className="grid gap-3" onSubmit={(e) => { e.preventDefault(); submit() }}>
            <div className="card flex items-center gap-4 p-4">
              {chosen ? <Avatar name={chosen.name} src={chosen.photo_url} size={52} /> : <div className="flex h-[52px] w-[52px] items-center justify-center rounded-full bg-gold-soft text-gold"><Sparkles size={20} /></div>}
              <div className="min-w-0 flex-1">
                <div className="font-semibold">{service.name}</div>
                <div className="text-sm text-mute">{prettyDate(date)} kl {time} · {staffName}</div>
              </div>
              {service.price_sek != null && <div className="font-bold text-gold">{service.price_sek} kr</div>}
            </div>
            <input className="input" required placeholder="Namn" autoComplete="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <input className="input" required type="tel" inputMode="tel" placeholder="Telefon" autoComplete="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            <input className="input" type="email" required={!me} placeholder={me ? 'E-post' : 'E-post (för bekräftelse)'} autoComplete="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            <textarea className="input min-h-[84px] resize-none" placeholder="Önskemål (valfritt)" value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} />
            <button className="btn-gold mt-1 !py-4 text-base" disabled={busy}>{busy ? 'Bokar…' : 'Bekräfta bokning'}</button>
            {!me && (
              <p className="text-center text-sm text-mute">
                Inget konto behövs. <Link href="/login" className="font-medium text-gold">Logga in</Link> om du vill spara dina bokningar
              </p>
            )}
          </form>
        )}
      </div>

      {service && step < 4 && (
        <div className="fixed inset-x-0 bottom-0 z-20 flex justify-center px-4 pb-[max(env(safe-area-inset-bottom),14px)]">
          <div className="glass fade flex w-full max-w-md items-center gap-3 rounded-full py-2 pl-5 pr-2">
            <div className="min-w-0 flex-1 text-sm">
              <div className="truncate font-semibold">{service.name}</div>
              <div className="truncate text-mute">{[staffName, `${service.duration_min} min`].filter(Boolean).join(' · ')}</div>
            </div>
            {service.price_sek != null && <div className="rounded-full bg-gold px-4 py-2.5 text-sm font-bold text-ongold">{service.price_sek} kr</div>}
          </div>
        </div>
      )}
    </section>
  )
}
