import { Clock, Trash2 } from 'lucide-react'
import SubmitButton from '@/components/SubmitButton'
import { requireSalon } from '@/lib/salon'
import { saveService, deleteService } from '../actions'
import { Flash } from '@/components/ui'
import Sheet from '@/components/Sheet'

type Svc = { id: string; name: string; description: string | null; duration_min: number; price_sek: number | null; active: boolean; sort: number }

function ServiceForm({ s, nextSort }: { s?: Svc; nextSort: number }) {
  return (
    <form action={saveService} className="grid grid-cols-2 gap-3">
      {s && <input type="hidden" name="id" value={s.id} />}
      <input type="hidden" name="sort" value={s?.sort ?? nextSort} />
      <input className="input col-span-2" name="name" defaultValue={s?.name} placeholder="Tjänst, t.ex. Fade" required />
      <input className="input col-span-2" name="description" defaultValue={s?.description ?? ''} placeholder="Kort beskrivning (valfritt)" />
      <div>
        <label className="label">Minuter</label>
        <input className="input" name="duration_min" type="number" min={5} max={480} step={5} defaultValue={s?.duration_min ?? 30} required />
      </div>
      <div>
        <label className="label">Pris (kr)</label>
        <input className="input" name="price_sek" type="number" min={0} defaultValue={s?.price_sek ?? ''} />
      </div>
      <label className="flex items-center gap-2.5 text-sm">
        <input type="checkbox" name="active" defaultChecked={s?.active ?? true} className="h-5 w-5 accent-[#d2ab5c]" /> Bokningsbar
      </label>
      <SubmitButton className="btn-gold !py-3" pending="Sparar…">{s ? 'Spara' : 'Lägg till'}</SubmitButton>
    </form>
  )
}

export default async function Services({ searchParams }: { searchParams: Promise<{ e?: string }> }) {
  const { e } = await searchParams
  const { supabase, salon } = await requireSalon()
  const { data } = await supabase.from('services').select('*').eq('salon_id', salon.id).order('sort')
  const list = (data ?? []) as Svc[]

  return (
    <div>
      <h1 className="rise mb-1 text-[26px] font-bold tracking-tight">Tjänster</h1>
      <p className="rise mb-5 text-sm text-mute">Tryck på en tjänst för att ändra.</p>
      <Flash e={e} />
      <div className="grid gap-2.5">
        {list.map((s, i) => (
          <details key={s.id} className="card rise group overflow-hidden" style={{ animationDelay: `${i * 0.03}s` }}>
            <summary className="flex cursor-pointer list-none items-center gap-4 px-5 py-4">
              <div className="min-w-0 flex-1">
                <div className={`font-semibold ${s.active ? '' : 'text-mute line-through'}`}>{s.name}</div>
                <div className="flex items-center gap-1 text-sm text-mute"><Clock size={13} /> {s.duration_min} min</div>
              </div>
              <div className="rounded-full bg-gold-soft px-3 py-1.5 text-sm font-semibold text-gold">{s.price_sek != null ? `${s.price_sek} kr` : '—'}</div>
            </summary>
            <div className="fade px-5 pb-5">
              <ServiceForm s={s} nextSort={s.sort} />
              <form action={deleteService} className="mt-3">
                <input type="hidden" name="id" value={s.id} />
                <button className="flex items-center gap-1.5 text-sm text-red-400"><Trash2 size={14} /> Ta bort</button>
              </form>
            </div>
          </details>
        ))}
      </div>
      <Sheet title="Ny tjänst" defaultOpen={list.length === 0}>
        <ServiceForm nextSort={list.length} />
      </Sheet>
    </div>
  )
}
