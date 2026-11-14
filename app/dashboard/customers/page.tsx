import { Phone, Search } from 'lucide-react'
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
}
type C = { key: string; name: string; phone: string | null; email: string | null; visits: number; noShows: number; spent: number; last: string | null; next: string | null }

const keyOf = (b: B) => (b.customer_phone?.replace(/\D/g, '').replace(/^46/, '0') || b.customer_email?.toLowerCase() || b.customer_name.toLowerCase()).trim()

export default async function Customers({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q = '' } = await searchParams
  const { supabase, salon } = await requireSalon()
  const { data } = await supabase
    .from('bookings')
    .select('customer_name, customer_phone, customer_email, starts_at, status, price_sek')
    .eq('salon_id', salon.id)
    .neq('status', 'cancelled')
    .order('starts_at', { ascending: false })
    .limit(3000)

  const now = Date.now()
  const map = new Map<string, C>()
  for (const b of (data ?? []) as B[]) {
    const k = keyOf(b)
    const c = map.get(k) ?? { key: k, name: b.customer_name, phone: b.customer_phone, email: b.customer_email, visits: 0, noShows: 0, spent: 0, last: null, next: null }
    const t = Date.parse(b.starts_at)
    if (b.status === 'no_show') c.noShows++
    else if (t < now) {
      c.visits++
      c.spent += b.price_sek ?? 0
      if (!c.last) c.last = b.starts_at
    } else c.next = b.starts_at
    map.set(k, c)
  }
  const needle = q.toLowerCase().trim()
  const list = [...map.values()]
    .filter((c) => !needle || `${c.name} ${c.phone ?? ''} ${c.email ?? ''}`.toLowerCase().includes(needle))
    .sort((a, b) => (b.last ?? b.next ?? '').localeCompare(a.last ?? a.next ?? ''))

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
            <div key={c.key} className="flex items-center gap-3 px-4 py-3.5">
              <Avatar name={c.name} size={44} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 truncate font-semibold">
                  {c.name}
                  {c.noShows > 0 && <span className="rounded-full bg-red-500/15 px-2 py-0.5 text-[10px] font-medium text-red-400">{c.noShows} uteblivna</span>}
                </div>
                <div className="truncate text-sm text-mute">
                  {c.visits} besök · {c.spent.toLocaleString('sv-SE')} kr
                  {c.next ? ` · nästa ${prettyDate(fmtTz(c.next, salon.timezone, 'yyyy-MM-dd'))}` : c.last ? ` · senast ${prettyDate(fmtTz(c.last, salon.timezone, 'yyyy-MM-dd'))}` : ''}
                </div>
              </div>
              {c.phone && <a href={`tel:${c.phone}`} className="icon-btn !h-10 !w-10" aria-label="Ring"><Phone size={16} /></a>}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
