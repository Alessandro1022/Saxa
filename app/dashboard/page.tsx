import Link from 'next/link'
import SubmitButton from '@/components/SubmitButton'
import { Phone, X } from 'lucide-react'
import { requireSalon, origin } from '@/lib/salon'
import { addDays, fmtTz, isDate, MONTHS, todayIn, WEEKDAYS, weekdayOf, zoned } from '@/lib/time'
import { addManualBooking, cancelBooking } from './actions'
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

  const [{ data: staff }, { data: services }, { data: rows }] = await Promise.all([
    supabase.from('staff').select('id, name, photo_url').eq('salon_id', salon.id).eq('active', true).order('sort'),
    supabase.from('services').select('id, name, duration_min').eq('salon_id', salon.id).eq('active', true).order('sort'),
    supabase
      .from('bookings')
      .select('id, starts_at, ends_at, service_name, price_sek, customer_name, customer_phone, note, source, staff_id')
      .eq('salon_id', salon.id)
      .eq('status', 'confirmed')
      .gte('starts_at', zoned(today, '00:00', tz).toISOString())
      .lt('starts_at', zoned(addDays(today, DAYS + 30), '00:00', tz).toISOString())
      .order('starts_at'),
  ])

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
    .filter((r) => fmtTz(r.starts_at, tz, 'yyyy-MM-dd') < weekEnd)
    .reduce((a, r) => a + (r.price_sek ?? 0), 0)
  const nextUp = all.find((r) => Date.parse(r.starts_at) > Date.now())
  const link = `${await origin()}/${salon.slug}`
  const [, m, dd] = day.split('-').map(Number)

  return (
    <div>
      <Flash e={sp.e} ok={sp.ok ? 'Bokningen är inlagd ✓' : undefined} />

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
              </Link>
            )
          })}
        </div>
      </section>

      <section className="mt-5">
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
              return (
                <div key={r.id} className={`card rise flex items-center gap-3 p-3 pr-3.5 ${done ? 'opacity-50' : ''}`} style={{ animationDelay: `${i * 0.03}s` }}>
                  <div className="w-1 self-stretch rounded-full" style={{ background: s?.color ?? '#888' }} />
                  <div className="w-[52px] text-center">
                    <div className="text-[17px] font-bold leading-tight">{fmtTz(r.starts_at, tz, 'HH:mm')}</div>
                    <div className="text-xs text-mute">{fmtTz(r.ends_at, tz, 'HH:mm')}</div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 truncate font-semibold">
                      {r.customer_name}
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
                  <form action={cancelBooking}>
                    <input type="hidden" name="id" value={r.id} />
                    <button className="icon-btn !h-10 !w-10 text-red-400" aria-label="Avboka"><X size={16} /></button>
                  </form>
                </div>
              )
            })}
          </div>
        )}
      </section>

      <Sheet title="Ny bokning" defaultOpen={!!sp.e}>
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
