import Link from 'next/link'
import SubmitButton from '@/components/SubmitButton'
import { Phone, X } from 'lucide-react'
import { requireSalon, origin } from '@/lib/salon'
import { addDays, fmtTz, isDate, MONTHS, todayIn, WEEKDAYS, weekdayOf, zoned } from '@/lib/time'
import { addManualBooking, addTimeOff, cancelBooking, deleteTimeOff, markPaid, toggleNoShow } from './actions'
import Tabs from '@/components/Tabs'
import { Ban, UserX } from 'lucide-react'
import { Avatar, Flash } from '@/components/ui'
import CopyButton from '@/components/CopyButton'
import Sheet from '@/components/Sheet'

const COLORS = ['#deBE78', '#7cc4ff', '#c79bff', '#6fdca0', '#ff9f8a', '#f7d154']

type Row = {
  id: string
  starts_at: string
  ends_at: string
  service_name: string
  price_sek: number | null
  customer_name: string
  customer_phone: string | null
  note: string | null
  source: string
  staff_id: string
  status: string
  payment_status?: string | null
  paid_sek?: number | null
  due_sek?: number | null
  stripe_payment_intent?: string | null
}

export default async function Bookings({
  searchParams,
}: {
  searchParams: Promise<{ e?: string; ok?: string; welcome?: string; d?: string }>
}) {
  const sp = await searchParams
  const { supabase, salon } = await requireSalon()
  const tz = salon.timezone
  const today = todayIn(tz)
  const day = sp.d && isDate(sp.d) ? sp.d : today
  const DAYS = 14

  const rangeStart = zoned(today, '00:00', tz).toISOString()
  const rangeEnd = zoned(addDays(today, DAYS + 30), '00:00', tz).toISOString()
  const [{ data: staff }, { data: services }, { data: rows }, off] = await Promise.all([
    supabase.from('staff').select('id, name, photo_url').eq('salon_id', salon.id).eq('active', true).order('sort'),
    supabase.from('services').select('id, name, duration_min').eq('salon_id', salon.id).eq('active', true).order('sort'),
    supabase
      .from('bookings')
      .select('*')
      .eq('salon_id', salon.id)
      .in('status', ['confirmed', 'no_show'])
      .gte('starts_at', rangeStart)
      .lt('starts_at', rangeEnd)
      .order('starts_at'),
    supabase.from('time_off').select('id, staff_id, starts_at, ends_at, reason').eq('salon_id', salon.id).lt('starts_at', rangeEnd).gt('ends_at', rangeStart).order('starts_at'),
  ])
  type Off = { id: string; staff_id: string | null; starts_at: string; ends_at: string; reason: string | null }
  const offs = (off.data ?? []) as Off[]
  const dayStartMs = zoned(day, '00:00', tz).getTime()
  const dayEndMs = zoned(addDays(day, 1), '00:00', tz).getTime()
  const offToday = offs.filter((o) => Date.parse(o.starts_at) < dayEndMs && Date.parse(o.ends_at) > dayStartMs)
  const offDays = new Set<string>()
  for (const o of offs) for (let i = 0; i < DAYS; i++) {
    const d = addDays(today, i)
    if (Date.parse(o.starts_at) < zoned(addDays(d, 1), '00:00', tz).getTime() && Date.parse(o.ends_at) > zoned(d, '00:00', tz).getTime()) offDays.add(d)
  }

  const all = (rows ?? []) as Row[]
  const byDay = new Map<string, Row[]>()
  for (const r of all) {
    const d = fmtTz(r.starts_at, tz, 'yyyy-MM-dd')
    byDay.set(d, [...(byDay.get(d) ?? []), r])
  }
  const list = byDay.get(day) ?? []
  const staffMap = new Map((staff ?? []).map((s, i) => [s.id, { ...s, color: COLORS[i % COLORS.length] }]))
  const weekEnd = addDays(today, 7)
  const weekRevenue = all
    .filter((r) => r.status === 'confirmed' && fmtTz(r.starts_at, tz, 'yyyy-MM-dd') < weekEnd)
    .reduce((a, r) => a + (r.price_sek ?? 0), 0)
  const nextUp = all.find((r) => r.status === 'confirmed' && Date.parse(r.starts_at) > Date.now())
  const link = `${await origin()}/${salon.slug}`
  const [, m, dd] = day.split('-').map(Number)

  return (
    <div>
      <Flash e={sp.e} ok={sp.ok === '2' ? 'Tiden är blockerad ✓' : sp.ok ? 'Bokningen är inlagd ✓' : undefined} />

      {sp.welcome && (
        <div className="card rise mb-6 p-5">
          <div className="text-lg font-semibold">Klart! 🎉 Du är bokningsbar.</div>
          <p className="mt-1 text-sm text-mute">Lägg länken i Instagram-bion och lägg till bilder under Team och Salong.</p>
          <div className="mt-3 flex items-center gap-2">
            <code className="flex-1 truncate rounded-full px-4 py-2.5 text-sm" style={{ background: 'color-mix(in srgb, rgb(var(--fg)) 5%, rgb(var(--ink)))' }}>{link}</code>
            <CopyButton text={link} />
          </div>
        </div>
      )}

      <section className="rise grid grid-cols-3 gap-2.5">
        <Stat label="Idag" value={String(byDay.get(today)?.length ?? 0)} sub="bokningar" />
        <Stat label="7 dagar" value={`${weekRevenue.toLocaleString('sv-SE')}`} sub="kr" gold />
        <Stat
          label="Nästa"
          value={nextUp ? fmtTz(nextUp.starts_at, tz, 'HH:mm') : '–'}
          sub={nextUp ? nextUp.customer_name.split(' ')[0] : 'ingen'}
        />
      </section>

      <section className="rise rise-1 mt-7">
        <div className="mb-3 flex items-baseline justify-between">
          <h1 className="text-[26px] font-bold tracking-tight">
            {day === today ? 'Idag' : day === addDays(today, 1) ? 'Imorgon' : ['Söndag','Måndag','Tisdag','Onsdag','Torsdag','Fredag','Lördag'][weekdayOf(day)]}
            <span className="ml-2 text-base font-medium text-mute">{dd} {MONTHS[m - 1]}</span>
          </h1>
          {day !== today && <Link href="/dashboard" className="text-sm font-medium text-gold">Idag</Link>}
        </div>
        <div className="no-scrollbar -mx-5 flex gap-2 overflow-x-auto px-5 pb-1">
          {Array.from({ length: DAYS }, (_, i) => addDays(today, i)).map((d) => {
            const on = d === day
            const n = byDay.get(d)?.length ?? 0
            return (
              <Link
                key={d}
                href={d === today ? '/dashboard' : `/dashboard?d=${d}`}
                className={`relative flex h-[74px] w-[54px] shrink-0 flex-col items-center justify-center rounded-[22px] transition ${on ? 'bg-gold text-ongold' : 'hover:bg-fg/[0.08]'}`}
                style={on ? undefined : { background: 'color-mix(in srgb, rgb(var(--fg)) 4.5%, rgb(var(--ink)))' }}
              >
                <span className={`text-[11px] font-medium uppercase ${on ? '' : 'text-mute'}`}>{WEEKDAYS[weekdayOf(d)]}</span>
                <span className="text-lg font-bold">{Number(d.slice(8))}</span>
                {n > 0 && <span className={`absolute bottom-2 h-1.5 w-1.5 rounded-full ${on ? 'bg-ongold' : 'bg-gold'}`} />}
                {offDays.has(d) && <span className={`absolute right-2 top-2 h-1.5 w-1.5 rounded-full ${on ? 'bg-ongold/50' : 'bg-mute'}`} />}
              </Link>
            )
          })}
        </div>
      </section>

      <section className="mt-5">
        {offToday.length > 0 && (
          <div className="mb-2.5 grid gap-2">
            {offToday.map((o) => (
              <div key={o.id} className="flex items-center gap-3 rounded-[24px] px-4 py-3" style={{ background: 'repeating-linear-gradient(135deg, color-mix(in srgb, rgb(var(--fg)) 5%, rgb(var(--ink))) 0 10px, color-mix(in srgb, rgb(var(--fg)) 8%, rgb(var(--ink))) 10px 20px)' }}>
                <Ban size={18} className="text-mute" />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold">{o.reason || 'Blockerad tid'} · {o.staff_id ? staffMap.get(o.staff_id)?.name ?? '' : 'Hela salongen'}</div>
                  <div className="text-xs text-mute">{fmtTz(o.starts_at, tz, 'd/M HH:mm')} – {fmtTz(o.ends_at, tz, 'd/M HH:mm')}</div>
                </div>
                <form action={deleteTimeOff}>
                  <input type="hidden" name="id" value={o.id} />
                  <button className="icon-btn !h-9 !w-9" aria-label="Ta bort blockering"><X size={15} /></button>
                </form>
              </div>
            ))}
          </div>
        )}
        {list.length === 0 ? (
          <div className="card rise px-6 py-12 text-center">
            <p className="font-medium">Inga bokningar</p>
            <p className="text-sm text-mute">Tryck på + för att lägga in en DM- eller telefonbokning.</p>
          </div>
        ) : (
          <div className="grid gap-2.5">
            {list.map((r, i) => {
              const s = staffMap.get(r.staff_id)
              const done = Date.parse(r.ends_at) < Date.now()
              const noShow = r.status === 'no_show'
              return (
                <div key={r.id} className={`card rise flex items-center gap-3 p-3 pr-3.5 ${done && !noShow ? 'opacity-60' : ''}`} style={{ animationDelay: `${i * 0.03}s` }}>
                  <div className="w-1 self-stretch rounded-full" style={{ background: s?.color ?? '#888' }} />
                  <div className="w-[52px] text-center">
                    <div className="text-[17px] font-bold leading-tight">{fmtTz(r.starts_at, tz, 'HH:mm')}</div>
                    <div className="text-xs text-mute">{fmtTz(r.ends_at, tz, 'HH:mm')}</div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 font-semibold">
                      {r.customer_name}
                      {r.payment_status === 'paid' && r.stripe_payment_intent && <span className="shrink-0 rounded-full bg-gold-soft px-2 py-0.5 text-[10px] font-medium text-gold">Betald {r.paid_sek} kr</span>}
                      {(r.payment_status === 'awaiting' || (r.payment_status === 'paid' && !r.stripe_payment_intent)) && (
                        <form action={markPaid} className="shrink-0">
                          <input type="hidden" name="id" value={r.id} />
                          <input type="hidden" name="due" value={r.due_sek ?? r.paid_sek ?? 0} />
                          <input type="hidden" name="paid" value={r.payment_status === 'paid' ? '1' : '0'} />
                          <button
                            title={r.payment_status === 'paid' ? 'Ångra' : 'Markera som betald'}
                            className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${r.payment_status === 'paid' ? 'bg-gold-soft text-gold' : 'bg-amber-500/20 text-amber-500'}`}
                          >
                            {r.payment_status === 'paid' ? `Betald ${r.paid_sek} kr ✓` : `Väntar på Swish ${r.due_sek} kr · bekräfta`}
                          </button>
                        </form>
                      )}
                      {noShow && <span className="rounded-full bg-red-500/15 px-2 py-0.5 text-[10px] font-medium text-red-400">Utebliven</span>}
                      {r.source === 'manual' && <span className="rounded-full px-2 py-0.5 text-[10px] font-medium text-mute" style={{ background: 'color-mix(in srgb, rgb(var(--fg)) 7%, rgb(var(--ink)))' }}>DM</span>}
                    </div>
                    <div className="truncate text-sm text-mute">
                      {r.service_name}
                      {r.note ? ` · ”${r.note}”` : ''}
                    </div>
                  </div>
                  {s && <Avatar name={s.name} src={s.photo_url} size={30} />}
                  {r.customer_phone && (
                    <a href={`tel:${r.customer_phone}`} className="icon-btn !h-10 !w-10" aria-label="Ring"><Phone size={16} /></a>
                  )}
                  {done ? (
                    <form action={toggleNoShow}>
                      <input type="hidden" name="id" value={r.id} />
                      <input type="hidden" name="status" value={r.status} />
                      <button className={`icon-btn !h-10 !w-10 ${noShow ? '!bg-red-500/20 text-red-400' : ''}`} aria-label="Utebliven" title={noShow ? 'Ångra utebliven' : 'Markera utebliven'}><UserX size={16} /></button>
                    </form>
                  ) : (
                    <form action={cancelBooking}>
                      <input type="hidden" name="id" value={r.id} />
                      <button className="icon-btn !h-10 !w-10 text-red-400" aria-label="Avboka"><X size={16} /></button>
                    </form>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </section>

      <Sheet title="Lägg till" defaultOpen={!!sp.e}>
        <Tabs labels={['Bokning', 'Blockera tid']}>
        <form action={addManualBooking} className="grid grid-cols-2 gap-3">
          <input className="input col-span-2" name="name" required placeholder="Kundens namn" />
          <input className="input col-span-2" name="phone" type="tel" placeholder="Telefon (valfritt)" />
          <div className="col-span-2">
            <label className="label">Tjänst</label>
            <select className="input" name="service_id" required>
              {(services ?? []).map((s) => (
                <option key={s.id} value={s.id}>{s.name} · {s.duration_min} min</option>
              ))}
            </select>
          </div>
          <div className="col-span-2">
            <label className="label">Frisör</label>
            <select className="input" name="staff_id" required>
              {(staff ?? []).map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Datum</label>
            <input className="input" type="date" name="date" defaultValue={day} required />
          </div>
          <div>
            <label className="label">Tid</label>
            <input className="input" type="time" name="time" step={300} required />
          </div>
          <input className="input col-span-2" name="note" placeholder="Anteckning (valfritt)" />
          <SubmitButton className="btn-gold col-span-2 mt-1" pending="Sparar…">Spara bokning</SubmitButton>
        </form>
        <form action={addTimeOff} className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <label className="label">Vem</label>
            <select className="input" name="staff_id">
              <option value="all">Hela salongen (stängt)</option>
              {(staff ?? []).map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Från datum</label>
            <input className="input" type="date" name="from_date" defaultValue={day} required />
          </div>
          <div>
            <label className="label">Från tid</label>
            <input className="input" type="time" name="from_time" defaultValue="12:00" step={300} />
          </div>
          <div>
            <label className="label">Till datum</label>
            <input className="input" type="date" name="to_date" defaultValue={day} />
          </div>
          <div>
            <label className="label">Till tid</label>
            <input className="input" type="time" name="to_time" defaultValue="13:00" step={300} />
          </div>
          <input className="input col-span-2" name="reason" placeholder="Orsak, t.ex. Lunch, Semester, Sjuk" />
          <SubmitButton className="btn-gold col-span-2 mt-1" pending="Sparar…">Blockera tid</SubmitButton>
        </form>
        </Tabs>
      </Sheet>
    </div>
  )
}

function Stat({ label, value, sub, gold }: { label: string; value: string; sub: string; gold?: boolean }) {
  return (
    <div className="card p-4">
      <div className="text-xs font-medium text-mute">{label}</div>
      <div className={`mt-1 truncate text-2xl font-bold tracking-tight ${gold ? 'gold-text' : ''}`}>{value}</div>
      <div className="truncate text-xs text-mute">{sub}</div>
    </div>
  )
}
