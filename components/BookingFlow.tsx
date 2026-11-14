'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Clock, Loader2, Pencil, Sparkles, Zap } from 'lucide-react'
import { addDays, prettyDate, todayIn, WEEKDAYS, weekdayOf, MONTHS, type Slot } from '@/lib/time'
import { Avatar } from './ui'

type Staff = { id: string; name: string; title: string | null; bio: string | null; photo_url: string | null; rating?: { avg: number; n: number } | null }
type Service = { id: string; name: string; description: string | null; duration_min: number; price_sek: number | null }
type Quick = { date: string; time: string; staffIds: string[] }
type Details = { name: string; phone: string; email: string; note: string }

const DAYS = 30
const GUEST_KEY = 'saxa_guest'
const soft = (p: number) => ({ background: `color-mix(in srgb, rgb(var(--fg)) ${p}%, rgb(var(--ink)))` })

function loadGuest(): Partial<Details> {
  try {
    return JSON.parse(localStorage.getItem(GUEST_KEY) ?? '{}')
  } catch {
    return {}
  }
}

export default function BookingFlow({
  salonId,
  tz,
  staff,
  services,
  initialStaff,
  me,
  reschedule,
}: {
  salonId: string
  tz: string
  staff: Staff[]
  services: Service[]
  initialStaff?: string
  me: { name: string; phone: string; email: string } | null
  reschedule?: { token: string; serviceId: string; staffId: string; bookingId: string }
}) {
  const router = useRouter()
  const startService = reschedule ? services.find((s) => s.id === reschedule.serviceId) : services.length === 1 ? services[0] : undefined
  const [step, setStep] = useState(startService ? 2 : 1)
  const [service, setService] = useState<Service | null>(startService ?? null)
  const [staffId, setStaffId] = useState(reschedule?.staffId ?? initialStaff ?? (staff.length === 1 ? staff[0].id : 'any'))
  const today = useMemo(() => todayIn(tz), [tz])
  const [date, setDate] = useState(today)
  const [slots, setSlots] = useState<Slot[] | null>(null)
  const [quick, setQuick] = useState<Quick[] | null>(null)
  const [time, setTime] = useState('')
  const [form, setForm] = useState<Details>({ name: me?.name ?? '', phone: me?.phone ?? '', email: me?.email ?? '', note: '' })
  const [editing, setEditing] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  // Kom ihåg gästens uppgifter från förra bokningen
  useEffect(() => {
    if (me?.name && me?.phone) return
    const g = loadGuest()
    setForm((f) => ({ ...f, name: f.name || g.name || '', phone: f.phone || g.phone || '', email: f.email || g.email || '' }))
  }, [me])

  const days = useMemo(() => Array.from({ length: DAYS }, (_, i) => addDays(today, i)), [today])
  const chosen = staff.find((s) => s.id === staffId)
  const staffName = staffId === 'any' ? 'Första lediga' : chosen?.name
  const ex = reschedule ? `&exclude=${reschedule.bookingId}` : ''
  const known = !!(form.name && form.phone.replace(/\D/g, '').length >= 7 && (me || /\S+@\S+\.\S+/.test(form.email)))

  // Närmaste lediga tider
  useEffect(() => {
    if (step !== 2 || !service) return
    setQuick(null)
    const c = new AbortController()
    fetch(`/api/next?salon=${salonId}&service=${service.id}&staff=${staffId}${ex}`, { signal: c.signal })
      .then((r) => r.json())
      .then((d) => setQuick(d.slots ?? []))
      .catch(() => {})
    return () => c.abort()
  }, [step, service, staffId, salonId, ex])

  // Tider för vald dag
  useEffect(() => {
    if (step !== 2 || !service) return
    setSlots(null)
    const c = new AbortController()
    fetch(`/api/slots?salon=${salonId}&service=${service.id}&staff=${staffId}&date=${date}${ex}`, { signal: c.signal })
      .then((r) => r.json())
      .then((d) => setSlots(d.slots ?? []))
      .catch(() => {})
    return () => c.abort()
  }, [step, service, staffId, date, salonId, ex])

  function go(n: number) {
    setError('')
    setStep(n)
    document.getElementById('boka')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  function pick(d: string, t: string) {
    setDate(d)
    setTime(t)
    setEditing(!known)
    go(3)
  }

  async function submit() {
    setBusy(true)
    setError('')
    try {
      const r = reschedule
        ? await fetch('/api/reschedule', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token: reschedule.token, staffId, date, time }),
          })
        : await fetch('/api/book', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ salonId, serviceId: service?.id, staffId, date, time, ...form }),
          })
      const d = await r.json()
      if (!r.ok) {
        setError(d.error ?? 'Något gick fel')
        if (r.status === 409) go(2)
        else if (!reschedule) setEditing(true)
        setBusy(false)
        return
      }
      if (!me) {
        try {
          localStorage.setItem(GUEST_KEY, JSON.stringify({ name: form.name, phone: form.phone, email: form.email }))
        } catch {}
      }
      router.push(`/b/${d.token}${reschedule ? '?flyttad=1' : ''}`)
    } catch {
      setError('Kunde inte nå servern')
      setBusy(false)
    }
  }

  const [, mo] = date.split('-').map(Number)
  const dayLabel = (d: string) =>
    d === today ? 'Idag' : d === addDays(today, 1) ? 'Imorgon' : `${WEEKDAYS[weekdayOf(d)]} ${Number(d.slice(8))}/${Number(d.slice(5, 7))}`
  const titles = reschedule ? ['', 'Välj ny tid', 'Bekräfta ny tid'] : ['Välj tjänst', 'Välj tid', 'Bekräfta']
  const canBack = step === 3 || (step === 2 && !startService && !reschedule)

  return (
    <section className="mt-10 px-5">
      <div className="flex items-center gap-3">
        {canBack && (
          <button onClick={() => go(step - 1)} className="icon-btn" aria-label="Tillbaka"><ArrowLeft size={18} /></button>
        )}
        <div className="flex-1">
          <div className="text-xs font-medium uppercase tracking-wider text-gold">{reschedule ? 'Flytta bokning' : `Steg ${step} av 3`}</div>
          <h2 className="text-xl font-bold tracking-tight">{titles[step - 1]}</h2>
        </div>
        {step === 2 && service && !reschedule && services.length > 1 && (
          <button onClick={() => go(1)} className="pill !py-1.5 text-sm">{service.name}</button>
        )}
      </div>
      {!reschedule && (
        <div className="mt-4 grid grid-cols-3 gap-1.5">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-1 overflow-hidden rounded-full" style={soft(8)}>
              <div className="h-full rounded-full bg-gold transition-all duration-500" style={{ width: step >= i ? '100%' : '0%' }} />
            </div>
          ))}
        </div>
      )}

      {error && <p className="fade mt-4 rounded-2xl bg-red-500/10 px-4 py-3 text-sm text-red-400">{error}</p>}

      <div key={step} className="rise mt-5">
        {/* 1. Tjänst */}
        {step === 1 && (
          <div className="grid gap-2.5">
            {services.map((s) => (
              <button key={s.id} className={`tile flex items-center gap-4 ${service?.id === s.id ? 'tile-on' : ''}`} onClick={() => { setService(s); go(2) }}>
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

        {/* 2. Frisör + tid på samma skärm */}
        {step === 2 && (
          <div>
            {staff.length > 1 && (
              <div className="no-scrollbar -mx-5 mb-5 flex gap-2 overflow-x-auto px-5">
                <button
                  onClick={() => setStaffId('any')}
                  className={`flex shrink-0 items-center gap-2 rounded-full py-1.5 pl-1.5 pr-4 text-sm font-medium transition ${staffId === 'any' ? 'bg-gold text-ongold' : ''}`}
                  style={staffId === 'any' ? undefined : soft(5)}
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gold-soft text-gold"><Sparkles size={15} /></span>
                  Första lediga
                </button>
                {staff.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setStaffId(s.id)}
                    className={`flex shrink-0 items-center gap-2 rounded-full py-1.5 pl-1.5 pr-4 text-sm font-medium transition ${staffId === s.id ? 'bg-gold text-ongold' : ''}`}
                    style={staffId === s.id ? undefined : soft(5)}
                  >
                    <Avatar name={s.name} src={s.photo_url} size={32} />
                    {s.name}
                  </button>
                ))}
              </div>
            )}

            <div className="mb-2 flex items-center gap-1.5 text-sm font-medium text-mute"><Zap size={14} className="text-gold" /> Närmast lediga</div>
            <div className="no-scrollbar -mx-5 flex gap-2 overflow-x-auto px-5 pb-1">
              {quick === null ? (
                Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-[58px] w-28 shrink-0 animate-pulse rounded-[20px]" style={soft(6)} />)
              ) : quick.length === 0 ? (
                <p className="text-sm text-mute">Inga lediga tider de närmaste två veckorna.</p>
              ) : (
                quick.map((q) => (
                  <button key={q.date + q.time} onClick={() => pick(q.date, q.time)} className="shrink-0 rounded-[20px] px-4 py-2.5 text-left transition active:scale-95" style={soft(5)}>
                    <div className="text-xs text-mute">{dayLabel(q.date)}</div>
                    <div className="text-lg font-bold leading-tight">{q.time}</div>
                  </button>
                ))
              )}
            </div>

            <div className="mb-2 mt-6 text-sm font-medium text-mute">Eller välj dag · {MONTHS[mo - 1]}</div>
            <div className="no-scrollbar -mx-5 flex gap-2 overflow-x-auto px-5 pb-1">
              {days.map((d) => {
                const on = d === date
                return (
                  <button
                    key={d}
                    onClick={() => setDate(d)}
                    className={`flex h-[72px] w-[54px] shrink-0 flex-col items-center justify-center rounded-[20px] transition duration-300 ${on ? 'bg-gold text-ongold' : ''}`}
                    style={on ? undefined : soft(4.5)}
                  >
                    <span className={`text-[11px] font-medium uppercase ${on ? '' : 'text-mute'}`}>{d === today ? 'Idag' : WEEKDAYS[weekdayOf(d)]}</span>
                    <span className="text-lg font-bold">{Number(d.slice(8))}</span>
                  </button>
                )
              })}
            </div>
            <div className="mt-4 min-h-[120px]">
              {slots === null ? (
                <div className="grid grid-cols-4 gap-2">
                  {Array.from({ length: 8 }).map((_, i) => <div key={i} className="h-12 animate-pulse rounded-full" style={soft(5)} />)}
                </div>
              ) : slots.length === 0 ? (
                <div className="rounded-[24px] px-6 py-8 text-center" style={soft(4)}>
                  <p className="font-medium">Fullbokat den här dagen</p>
                  <p className="text-sm text-mute">Välj en tid ovan eller en annan dag.</p>
                </div>
              ) : (
                <div className="grid grid-cols-4 gap-2">
                  {slots.map((s) => (
                    <button key={s.time} onClick={() => pick(date, s.time)} className="h-12 rounded-full text-[15px] font-semibold transition duration-200 active:scale-95" style={soft(5)}>
                      {s.time}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* 3. Bekräfta – ett tryck om vi redan känner kunden */}
        {step === 3 && service && (
          <form className="grid gap-3" onSubmit={(e) => { e.preventDefault(); submit() }}>
            <div className="card p-5">
              <div className="flex items-center gap-4">
                {chosen ? (
                  <Avatar name={chosen.name} src={chosen.photo_url} size={56} />
                ) : (
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gold-soft text-gold"><Sparkles size={22} /></div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="text-lg font-bold leading-tight">{service.name}</div>
                  <div className="text-sm text-mute">{staffName} · {service.duration_min} min</div>
                </div>
                {service.price_sek != null && <div className="text-lg font-bold text-gold">{service.price_sek} kr</div>}
              </div>
              <button type="button" onClick={() => go(2)} className="mt-4 flex w-full items-center justify-between rounded-[20px] px-4 py-3 text-left" style={soft(4.5)}>
                <span>
                  <span className="block text-xs text-mute">När</span>
                  <span className="font-semibold">{prettyDate(date)} kl {time}</span>
                </span>
                <Pencil size={15} className="text-mute" />
              </button>
            </div>

            {!reschedule &&
              (known && !editing ? (
                <button type="button" onClick={() => setEditing(true)} className="flex items-center justify-between rounded-[20px] px-4 py-3 text-left" style={soft(4.5)}>
                  <span>
                    <span className="block text-xs text-mute">Bokar som</span>
                    <span className="font-semibold">{form.name} · {form.phone}</span>
                  </span>
                  <Pencil size={15} className="text-mute" />
                </button>
              ) : (
                <div className="fade grid gap-3">
                  <input className="input" required placeholder="Namn" autoComplete="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                  <input className="input" required type="tel" inputMode="tel" placeholder="Telefon" autoComplete="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                  <input className="input" type="email" required={!me} placeholder={me ? 'E-post' : 'E-post (för bekräftelse)'} autoComplete="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                  <textarea className="input min-h-[72px] resize-none" placeholder="Önskemål (valfritt)" value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} />
                </div>
              ))}

            <button className="btn-gold mt-1 !py-4 text-base" disabled={busy}>
              {busy ? (
                <><Loader2 size={18} className="animate-spin" /> {reschedule ? 'Flyttar…' : 'Bokar…'}</>
              ) : reschedule ? (
                'Flytta till den här tiden'
              ) : (
                'Bekräfta bokning'
              )}
            </button>
            {!me && !reschedule && (
              <p className="text-center text-sm text-mute">
                Inget konto behövs. <Link href="/login" className="font-medium text-gold">Logga in</Link> för att samla dina bokningar.
              </p>
            )}
          </form>
        )}
      </div>

      {service && step === 2 && (
        <div className="fixed inset-x-0 bottom-0 z-20 flex justify-center px-4 pb-[max(env(safe-area-inset-bottom),14px)]">
          <div className="glass fade flex w-full max-w-md items-center gap-3 rounded-full py-2 pl-5 pr-2">
            <div className="min-w-0 flex-1 text-sm">
              <div className="truncate font-semibold">{service.name}</div>
              <div className="truncate text-mute">{staffName} · {service.duration_min} min</div>
            </div>
            {service.price_sek != null && <div className="rounded-full bg-gold px-4 py-2.5 text-sm font-bold text-ongold">{service.price_sek} kr</div>}
          </div>
        </div>
      )}
    </section>
  )
}
