import { requireSalon, origin } from '@/lib/salon'
import { addDays, fmtTz, prettyDate, todayIn, zoned } from '@/lib/time'
import { addManualBooking, cancelBooking } from './actions'
import Flash from '@/components/Flash'
import CopyButton from '@/components/CopyButton'

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
  searchParams: Promise<{ e?: string; ok?: string; welcome?: string; staff?: string }>
}) {
  const sp = await searchParams
  const { supabase, salon } = await requireSalon()
  const tz = salon.timezone
  const today = todayIn(tz)

  const [{ data: staff }, { data: services }, { data: rows }] = await Promise.all([
    supabase.from('staff').select('id, name').eq('salon_id', salon.id).eq('active', true).order('sort'),
    supabase.from('services').select('id, name, duration_min').eq('salon_id', salon.id).eq('active', true).order('sort'),
    supabase
      .from('bookings')
      .select('id, starts_at, ends_at, service_name, price_sek, customer_name, customer_phone, note, source, staff_id')
      .eq('salon_id', salon.id)
      .eq('status', 'confirmed')
      .gte('starts_at', zoned(today, '00:00', tz).toISOString())
      .lt('starts_at', zoned(addDays(today, 15), '00:00', tz).toISOString())
      .order('starts_at'),
  ])

  const staffName = Object.fromEntries((staff ?? []).map((s) => [s.id, s.name]))
  const filtered = ((rows ?? []) as Row[]).filter((r) => !sp.staff || r.staff_id === sp.staff)
  const groups = new Map<string, Row[]>()
  for (const r of filtered) {
    const d = fmtTz(r.starts_at, tz, 'yyyy-MM-dd')
    groups.set(d, [...(groups.get(d) ?? []), r])
  }
  const todayCount = groups.get(today)?.length ?? 0
  const todayRevenue = (groups.get(today) ?? []).reduce((a, r) => a + (r.price_sek ?? 0), 0)
  const link = `${await origin()}/${salon.slug}`

  return (
    <div>
      <Flash e={sp.e} ok={sp.ok ? 'Bokningen är inlagd ✓' : undefined} />

      {sp.welcome && (
        <div className="card mb-6 p-5">
          <div className="text-lg font-semibold">Klart! 🎉 Din salong är bokningsbar.</div>
          <p className="mt-1 text-sm text-mute">Lägg länken i Instagram-bion. Justera tjänster, personal och öppettider i flikarna nedan.</p>
          <div className="mt-3 flex items-center gap-2">
            <code className="flex-1 truncate rounded-xl bg-ink px-3 py-2 text-sm">{link}</code>
            <CopyButton text={link} />
          </div>
        </div>
      )}

      <div className="mb-6 grid grid-cols-2 gap-3">
        <div className="card p-4">
          <div className="text-xs uppercase tracking-wider text-mute">Idag</div>
          <div className="mt-1 text-2xl font-bold">{todayCount} <span className="text-sm font-normal text-mute">bokningar</span></div>
        </div>
        <div className="card p-4">
          <div className="text-xs uppercase tracking-wider text-mute">Intäkt idag</div>
          <div className="mt-1 text-2xl font-bold text-gold">{todayRevenue} kr</div>
        </div>
      </div>

      <details className="card mb-6 overflow-hidden" open={!!sp.e}>
        <summary className="cursor-pointer list-none px-5 py-4 font-semibold">＋ Lägg in bokning <span className="text-sm font-normal text-mute">(DM, telefon, drop-in)</span></summary>
        <form action={addManualBooking} className="grid grid-cols-2 gap-3 border-t border-line p-5">
          <div className="col-span-2">
            <label className="label">Kund</label>
            <input className="input" name="name" required placeholder="Namn" />
          </div>
          <div className="col-span-2">
            <input className="input" name="phone" type="tel" placeholder="Telefon (valfritt)" />
          </div>
          <div>
            <label className="label">Tjänst</label>
            <select className="input" name="service_id" required>
              {(services ?? []).map((s) => (
                <option key={s.id} value={s.id}>{s.name} ({s.duration_min} min)</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Frisör</label>
            <select className="input" name="staff_id" required>
              {(staff ?? []).map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Datum</label>
            <input className="input" type="date" name="date" defaultValue={today} required />
          </div>
          <div>
            <label className="label">Tid</label>
            <input className="input" type="time" name="time" step={300} required />
          </div>
          <input className="input col-span-2" name="note" placeholder="Anteckning (valfritt)" />
          <button className="btn-gold col-span-2">Spara bokning</button>
        </form>
      </details>

      {(staff ?? []).length > 1 && (
        <div className="no-scrollbar -mx-5 mb-4 flex gap-2 overflow-x-auto px-5">
          <a href="/dashboard" className={`chip !py-2 text-sm ${!sp.staff ? 'chip-on' : ''}`}>Alla</a>
          {(staff ?? []).map((s) => (
            <a key={s.id} href={`/dashboard?staff=${s.id}`} className={`chip shrink-0 !py-2 text-sm ${sp.staff === s.id ? 'chip-on' : ''}`}>{s.name}</a>
          ))}
        </div>
      )}

      {groups.size === 0 ? (
        <p className="card p-6 text-center text-mute">Inga bokningar de kommande två veckorna än.</p>
      ) : (
        <div className="space-y-6">
          {[...groups.entries()].map(([d, list]) => (
            <section key={d}>
              <h3 className="mb-2 text-sm font-semibold text-mute">{d === today ? 'Idag' : d === addDays(today, 1) ? 'Imorgon' : prettyDate(d)}</h3>
              <div className="card divide-y divide-line">
                {list.map((r) => (
                  <div key={r.id} className="flex items-center gap-4 px-4 py-3.5">
                    <div className="w-14 text-center">
                      <div className="font-semibold">{fmtTz(r.starts_at, tz, 'HH:mm')}</div>
                      <div className="text-xs text-mute">{fmtTz(r.ends_at, tz, 'HH:mm')}</div>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-medium">
                        {r.customer_name}
                        {r.source === 'manual' && <span className="ml-2 rounded-md bg-line px-1.5 py-0.5 text-[10px] text-mute">manuell</span>}
                      </div>
                      <div className="truncate text-sm text-mute">
                        {r.service_name} · {staffName[r.staff_id] ?? '—'}
                        {r.note ? ` · ”${r.note}”` : ''}
                      </div>
                    </div>
                    {r.customer_phone && (
                      <a href={`tel:${r.customer_phone}`} className="btn-ghost h-10 w-10 !p-0" aria-label="Ring">📞</a>
                    )}
                    <form action={cancelBooking}>
                      <input type="hidden" name="id" value={r.id} />
                      <button className="btn-ghost h-10 w-10 !p-0 text-red-300" aria-label="Avboka" title="Avboka">✕</button>
                    </form>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  )
}
