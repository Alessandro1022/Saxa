import { ChevronDown, Mail, MessageCircle, Phone, Search } from 'lucide-react'
import { bookingRef } from '@/lib/ref'
import { requireSalon } from '@/lib/salon'
import { fmtTz, prettyDate } from '@/lib/time'
import { Avatar } from '@/components/ui'

type B = {
  customer_name: string
  customer_phone: string | null
  customer_email: string | null
  starts_at: string
  status: string
  price_sek: number | null
  service_name: string
  id: string
}
type C = { key: string; name: string; phone: string | null; email: string | null; visits: number; noShows: number; spent: number; last: string | null; next: string | null; history: B[] }

const keyOf = (b: B) => (b.customer_phone?.replace(/\D/g, '').replace(/^46/, '0') || b.customer_email?.toLowerCase() || b.customer_name.toLowerCase()).trim()

export default async function Customers({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q = '' } = await searchParams
  const { supabase, salon } = await requireSalon()
  const { data } = await supabase
    .from('bookings')
    .select('id, customer_name, customer_phone, customer_email, starts_at, status, price_sek, service_name')
    .eq('salon_id', salon.id)
    .neq('status', 'cancelled')
    .order('starts_at', { ascending: false })
    .limit(3000)

  const now = Date.now()
  const map = new Map<string, C>()
  for (const b of (data ?? []) as B[]) {
    const k = keyOf(b)
    const c = map.get(k) ?? { key: k, name: b.customer_name, phone: b.customer_phone, email: b.customer_email, visits: 0, noShows: 0, spent: 0, last: null, next: null, history: [] }
    const t = Date.parse(b.starts_at)
    if (c.history.length < 6) c.history.push(b)
    c.phone ??= b.customer_phone
    c.email ??= b.customer_email
    if (b.status === 'no_show') c.noShows++
    else if (t < now) {
      c.visits++
      c.spent += b.price_sek ?? 0
      if (!c.last) c.last = b.starts_at
    } else c.next = b.starts_at // listan är nyast först → slutar på den närmaste
    map.set(k, c)
  }
  const needle = q.toLowerCase().trim()
  const list = [...map.values()]
    .filter((c) => !needle || `${c.name} ${c.phone ?? ''} ${c.email ?? ''}`.toLowerCase().includes(needle))
    .sort((a, b) => (b.last ?? b.next ?? '').localeCompare(a.last ?? a.next ?? ''))

  const when = (iso: string) => `${prettyDate(fmtTz(iso, salon.timezone, 'yyyy-MM-dd'))} kl ${fmtTz(iso, salon.timezone, 'HH:mm')}`

  return (
    <div>
      <h1 className="rise mb-1 text-[26px] font-bold tracking-tight">Kunder</h1>
      <p className="rise mb-5 text-sm text-mute">{map.size} kunder · byggs automatiskt från bokningarna</p>
      <form className="glass mb-4 flex items-center gap-3 rounded-full px-5 py-3">
        <Search size={17} className="text-mute" />
        <input name="q" defaultValue={q} placeholder="Sök namn, telefon eller mejl" className="w-full bg-transparent text-[15px] outline-none placeholder:text-mute" />
      </form>
      {list.length === 0 ? (
        <div className="card px-6 py-12 text-center text-mute">{q ? 'Ingen kund matchar.' : 'Inga kunder än – de dyker upp här när någon bokar.'}</div>
      ) : (
        <div className="card divide-hair overflow-hidden">
          {list.map((c) => (
            <details key={c.key} className="group">
              <summary className="flex cursor-pointer list-none items-center gap-3 px-4 py-3.5">
                <Avatar name={c.name} size={44} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 truncate font-semibold">
                    {c.name}
                    {c.noShows > 0 && <span className="rounded-full bg-red-500/15 px-2 py-0.5 text-[10px] font-medium text-red-400">{c.noShows} uteblivna</span>}
                  </div>
                  <div className="truncate text-sm text-mute">
                    {c.visits} besök · {c.spent.toLocaleString('sv-SE')} kr
                    {c.next ? ` · nästa ${when(c.next)}` : c.last ? ` · senast ${when(c.last)}` : ''}
                  </div>
                </div>
                <ChevronDown size={18} className="shrink-0 text-mute transition group-open:rotate-180" />
              </summary>
              <div className="fade grid gap-2 px-4 pb-4">
                {c.phone ? (
                  <div className="flex items-center gap-2 rounded-[18px] py-2 pl-4 pr-2" style={{ background: 'color-mix(in srgb, rgb(var(--fg)) 4.5%, rgb(var(--ink)))' }}>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs text-mute">Telefon</div>
                      <div className="truncate font-semibold">{c.phone}</div>
                    </div>
                    <a href={`sms:${c.phone}`} className="icon-btn !h-10 !w-10" aria-label="Sms:a"><MessageCircle size={16} /></a>
                    <a href={`tel:${c.phone}`} className="icon-btn !h-10 !w-10" aria-label="Ring"><Phone size={16} /></a>
                  </div>
                ) : null}
                {c.email ? (
                  <div className="flex items-center gap-2 rounded-[18px] py-2 pl-4 pr-2" style={{ background: 'color-mix(in srgb, rgb(var(--fg)) 4.5%, rgb(var(--ink)))' }}>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs text-mute">E-post</div>
                      <div className="truncate font-semibold">{c.email}</div>
                    </div>
                    <a href={`mailto:${c.email}`} className="icon-btn !h-10 !w-10" aria-label="Mejla"><Mail size={16} /></a>
                  </div>
                ) : null}
                {!c.phone && !c.email && <p className="text-sm text-mute">Inga kontaktuppgifter sparade.</p>}
                <div className="mt-1 text-xs font-medium text-mute">Senaste bokningar</div>
                {c.history.map((h) => (
                  <div key={h.id} className="flex items-center justify-between gap-3 text-sm">
                    <span className="truncate">{when(h.starts_at)} · {h.service_name}</span>
                    <span className="shrink-0 text-xs text-mute">{h.status === 'no_show' ? 'Utebliven' : Date.parse(h.starts_at) > now ? 'Kommande' : 'Klar'} · {bookingRef(h.id)}</span>
                  </div>
                ))}
              </div>
            </details>
          ))}
        </div>
      )}
    </div>
  )
}
