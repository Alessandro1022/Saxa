import { requireSalon } from '@/lib/salon'
import { saveService, deleteService } from '../actions'
import Flash from '@/components/Flash'

type Svc = { id: string; name: string; description: string | null; duration_min: number; price_sek: number | null; active: boolean; sort: number }

function ServiceForm({ s, nextSort }: { s?: Svc; nextSort: number }) {
  return (
    <form action={saveService} className="grid grid-cols-6 gap-2.5 p-4">
      {s && <input type="hidden" name="id" value={s.id} />}
      <input type="hidden" name="sort" value={s?.sort ?? nextSort} />
      <input className="input col-span-6" name="name" defaultValue={s?.name} placeholder="Tjänst, t.ex. Fade" required />
      <input className="input col-span-6" name="description" defaultValue={s?.description ?? ''} placeholder="Kort beskrivning (valfritt)" />
      <div className="col-span-3">
        <label className="label">Minuter</label>
        <input className="input" name="duration_min" type="number" min={5} max={480} step={5} defaultValue={s?.duration_min ?? 30} required />
      </div>
      <div className="col-span-3">
        <label className="label">Pris (kr)</label>
        <input className="input" name="price_sek" type="number" min={0} defaultValue={s?.price_sek ?? ''} />
      </div>
      <label className="col-span-3 flex items-center gap-2 text-sm text-mute">
        <input type="checkbox" name="active" defaultChecked={s?.active ?? true} className="h-4 w-4 accent-[#d6b46a]" /> Bokningsbar
      </label>
      <button className="btn-gold col-span-3 !py-2.5">{s ? 'Spara' : 'Lägg till'}</button>
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
      <h1 className="mb-4 text-2xl font-bold">Tjänster</h1>
      <Flash e={e} />
      <div className="space-y-3">
        {list.map((s) => (
          <details key={s.id} className="card overflow-hidden">
            <summary className="flex cursor-pointer list-none items-center gap-3 px-5 py-4">
              <div className="flex-1">
                <div className={`font-medium ${s.active ? '' : 'text-mute line-through'}`}>{s.name}</div>
                <div className="text-sm text-mute">{s.duration_min} min</div>
              </div>
              <div className="font-semibold">{s.price_sek != null ? `${s.price_sek} kr` : '—'}</div>
            </summary>
            <div className="border-t border-line">
              <ServiceForm s={s} nextSort={s.sort} />
              <form action={deleteService} className="px-4 pb-4">
                <input type="hidden" name="id" value={s.id} />
                <button className="text-sm text-red-300 hover:underline">Ta bort tjänst</button>
              </form>
            </div>
          </details>
        ))}
        <div className="card">
          <div className="px-5 pt-4 font-semibold">＋ Ny tjänst</div>
          <ServiceForm nextSort={list.length} />
        </div>
      </div>
    </div>
  )
}
