'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { addDays, prettyDate, todayIn, WEEKDAYS, weekdayOf, type Slot } from '@/lib/time'

type Staff = { id: string; name: string; title: string | null; bio: string | null; photo_url: string | null }
type Service = { id: string; name: string; description: string | null; duration_min: number; price_sek: number | null }

const DAYS = 30

function Avatar({ s, size = 'h-12 w-12' }: { s: { name: string; photo_url?: string | null }; size?: string }) {
  return (
    <div className={`${size} shrink-0 overflow-hidden rounded-2xl bg-line`}>
      {s.photo_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={s.photo_url} alt="" className="h-full w-full object-cover" />
      ) : (
        <div className="flex h-full items-center justify-center font-semibold text-mute">{s.name[0]}</div>
      )}
    </div>
  )
}

export default function BookingFlow({
  salonId,
  tz,
  staff,
  services,
}: {
  salonId: string
  tz: string
  staff: Staff[]
  services: Service[]
}) {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [service, setService] = useState<Service | null>(null)
  const [staffId, setStaffId] = useState<string>(staff.length === 1 ? staff[0].id : '')
  const today = useMemo(() => todayIn(tz), [tz])
  const [date, setDate] = useState(today)
  const [slots, setSlots] = useState<Slot[] | null>(null)
  const [time, setTime] = useState('')
  const [form, setForm] = useState({ name: '', phone: '', email: '', note: '' })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const days = useMemo(() => Array.from({ length: DAYS }, (_, i) => addDays(today, i)), [today])
  const staffName = staffId === 'any' ? 'Första lediga' : staff.find((s) => s.id === staffId)?.name

  useEffect(() => {
    if (step !== 3 || !service || !staffId) return
    setSlots(null)
    setTime('')
    const ctrl = new AbortController()
    fetch(`/api/slots?salon=${salonId}&service=${service.id}&staff=${staffId}&date=${date}`, { signal: ctrl.signal })
      .then((r) => r.json())
      .then((d) => setSlots(d.slots ?? []))
      .catch(() => {})
    return () => ctrl.abort()
  }, [step, service, staffId, date, salonId])

  async function submit() {
    setBusy(true)
    setError('')
    const r = await fetch('/api/book', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ salonId, serviceId: service?.id, staffId, date, time, ...form }),
    })
    const d = await r.json()
    if (!r.ok) {
      setBusy(false)
      setError(d.error ?? 'Något gick fel')
      if (r.status === 409) setStep(3)
      return
    }
    router.push(`/b/${d.token}`)
  }

  const Title = ({ n, t }: { n: number; t: string }) => (
    <div className="mb-4 flex items-center gap-3">
      {n > 1 && (
        <button onClick={() => setStep(n === 3 && staff.length === 1 ? 1 : n - 1)} className="btn-ghost h-10 w-10 !p-0" aria-label="Tillbaka">
          ←
        </button>
      )}
      <h2 className="text-lg font-semibold">{t}</h2>
      <span className="ml-auto text-xs text-mute">{n}/4</span>
    </div>
  )

  return (
    <section className="px-5 pt-8">
      {error && <p className="mb-4 rounded-2xl border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-300">{error}</p>}

      {step === 1 && (
        <div className="rise">
          <Title n={1} t="Välj tjänst" />
          <div className="grid gap-2.5">
            {services.map((s) => (
              <button
                key={s.id}
                className={`chip flex items-center gap-3 ${service?.id === s.id ? 'chip-on' : ''}`}
                onClick={() => {
                  setService(s)
                  setStep(staff.length === 1 ? 3 : 2)
                }}
              >
                <div className="flex-1">
                  <div className="font-medium">{s.name}</div>
                  <div className="text-sm text-mute">{s.description}</div>
                </div>
                <div className="text-right">
                  {s.price_sek != null && <div className="font-semibold">{s.price_sek} kr</div>}
                  <div className="text-xs text-mute">{s.duration_min} min</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="rise">
          <Title n={2} t="Välj frisör" />
          <div className="grid gap-2.5">
            <button
              className={`chip flex items-center gap-3 ${staffId === 'any' ? 'chip-on' : ''}`}
              onClick={() => {
                setStaffId('any')
                setStep(3)
              }}
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gold-soft text-xl text-gold">⚡</div>
              <div>
                <div className="font-medium">Första lediga</div>
                <div className="text-sm text-mute">Flest tider att välja på</div>
              </div>
            </button>
            {staff.map((s) => (
              <button
                key={s.id}
                className={`chip flex items-center gap-3 ${staffId === s.id ? 'chip-on' : ''}`}
                onClick={() => {
                  setStaffId(s.id)
                  setStep(3)
                }}
              >
                <Avatar s={s} />
                <div>
                  <div className="font-medium">{s.name}</div>
                  <div className="text-sm text-mute">{s.bio || s.title || 'Frisör'}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="rise">
          <Title n={3} t="Välj tid" />
          <div className="no-scrollbar -mx-5 flex gap-2 overflow-x-auto px-5 pb-2">
            {days.map((d) => {
              const on = d === date
              return (
                <button
                  key={d}
                  onClick={() => setDate(d)}
                  className={`flex h-[72px] w-14 shrink-0 flex-col items-center justify-center rounded-2xl border transition ${
                    on ? 'border-gold bg-gold text-ink' : 'border-line bg-card'
                  }`}
                >
                  <span className={`text-[11px] uppercase ${on ? '' : 'text-mute'}`}>{d === today ? 'Idag' : WEEKDAYS[weekdayOf(d)]}</span>
                  <span className="text-lg font-semibold">{Number(d.slice(8))}</span>
                </button>
              )
            })}
          </div>
          <div className="mt-4 min-h-[140px]">
            {slots === null ? (
              <div className="grid grid-cols-4 gap-2">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="h-11 animate-pulse rounded-xl bg-card" />
                ))}
              </div>
            ) : slots.length === 0 ? (
              <p className="card p-5 text-center text-mute">Inga lediga tider den här dagen. Testa en annan dag.</p>
            ) : (
              <div className="grid grid-cols-4 gap-2">
                {slots.map((s) => (
                  <button
                    key={s.time}
                    onClick={() => {
                      setTime(s.time)
                      setStep(4)
                      setError('')
                    }}
                    className={`h-11 rounded-xl border text-sm font-medium transition ${
                      time === s.time ? 'border-gold bg-gold text-ink' : 'border-line bg-card hover:border-mute'
                    }`}
                  >
                    {s.time}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {step === 4 && (
        <div className="rise">
          <Title n={4} t="Dina uppgifter" />
          <form
            className="grid gap-3"
            onSubmit={(e) => {
              e.preventDefault()
              submit()
            }}
          >
            <div>
              <label className="label">Namn</label>
              <input className="input" required autoComplete="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <label className="label">Telefon</label>
              <input className="input" required type="tel" autoComplete="tel" inputMode="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </div>
            <div>
              <label className="label">E-post (valfritt)</label>
              <input className="input" type="email" autoComplete="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
            <div>
              <label className="label">Meddelande (valfritt)</label>
              <textarea className="input min-h-[80px]" placeholder="T.ex. önskemål om klippning" value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} />
            </div>
            <button className="btn-gold mt-2" disabled={busy}>
              {busy ? 'Bokar…' : 'Bekräfta bokning'}
            </button>
          </form>
        </div>
      )}

      {service && (
        <div className="fixed inset-x-0 bottom-0 z-10 border-t border-line bg-ink/90 backdrop-blur">
          <div className="mx-auto flex max-w-md items-center gap-3 px-5 py-4 text-sm">
            <div className="flex-1">
              <div className="font-semibold">{service.name}</div>
              <div className="text-mute">
                {[staffName, time ? `${prettyDate(date)} ${time}` : null].filter(Boolean).join(' · ') || `${service.duration_min} min`}
              </div>
            </div>
            {service.price_sek != null && <div className="text-base font-semibold text-gold">{service.price_sek} kr</div>}
          </div>
        </div>
      )}
    </section>
  )
}
