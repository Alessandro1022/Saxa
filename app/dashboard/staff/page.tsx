import { requireSalon, origin } from '@/lib/salon'
import { saveStaff, deleteStaff, saveHours } from '../actions'
import { WEEKDAYS, WEEK_ORDER } from '@/lib/time'
import ImageUpload from '@/components/ImageUpload'
import CopyButton from '@/components/CopyButton'
import Flash from '@/components/Flash'

type Staff = { id: string; name: string; title: string | null; bio: string | null; photo_url: string | null; active: boolean; ical_token: string }
type H = { staff_id: string; weekday: number; start_time: string; end_time: string }

function StaffForm({ s, salonId }: { s?: Staff; salonId: string }) {
  return (
    <form action={saveStaff} className="flex gap-4 p-4">
      {s && <input type="hidden" name="id" value={s.id} />}
      <ImageUpload name="photo_url" salonId={salonId} initial={s?.photo_url} />
      <div className="grid flex-1 gap-2.5">
        <input className="input" name="name" defaultValue={s?.name} placeholder="Namn" required />
        <input className="input" name="title" defaultValue={s?.title ?? ''} placeholder="Titel, t.ex. Barber" />
        <input className="input" name="bio" defaultValue={s?.bio ?? ''} placeholder="Kort om dig, t.ex. Fade-specialist" />
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 text-sm text-mute">
            <input type="checkbox" name="active" defaultChecked={s?.active ?? true} className="h-4 w-4 accent-[#d6b46a]" /> Tar bokningar
          </label>
          <button className="btn-gold !py-2.5">{s ? 'Spara' : 'Lägg till'}</button>
        </div>
      </div>
    </form>
  )
}

export default async function StaffPage({ searchParams }: { searchParams: Promise<{ e?: string }> }) {
  const { e } = await searchParams
  const { supabase, salon } = await requireSalon()
  const [{ data: staff }, { data: hours }] = await Promise.all([
    supabase.from('staff').select('*').eq('salon_id', salon.id).order('sort'),
    supabase.from('staff_hours').select('staff_id, weekday, start_time, end_time').eq('salon_id', salon.id),
  ])
  const base = await origin()
  const host = base.replace(/^https?:\/\//, '')

  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold">Personal</h1>
      <Flash e={e} />
      <div className="space-y-4">
        {((staff ?? []) as Staff[]).map((s) => {
          const h = ((hours ?? []) as H[]).filter((x) => x.staff_id === s.id)
          const webcal = `webcal://${host}/api/ical/${s.ical_token}.ics`
          const https = `${base}/api/ical/${s.ical_token}.ics`
          return (
            <div key={s.id} className="card overflow-hidden">
              <StaffForm s={s} salonId={salon.id} />

              <details className="border-t border-line">
                <summary className="cursor-pointer list-none px-5 py-3.5 text-sm font-medium">🕘 Arbetstider</summary>
                <form action={saveHours} className="grid gap-2 px-5 pb-5">
                  <input type="hidden" name="staff_id" value={s.id} />
                  {WEEK_ORDER.map((d) => {
                    const row = h.find((x) => x.weekday === d)
                    return (
                      <div key={d} className="flex items-center gap-2">
                        <label className="flex w-16 items-center gap-2 text-sm">
                          <input type="checkbox" name={`open_${d}`} defaultChecked={!!row} className="h-4 w-4 accent-[#d6b46a]" />
                          {WEEKDAYS[d]}
                        </label>
                        <input className="input !py-2" type="time" name={`start_${d}`} defaultValue={row?.start_time.slice(0, 5) ?? '10:00'} />
                        <span className="text-mute">–</span>
                        <input className="input !py-2" type="time" name={`end_${d}`} defaultValue={row?.end_time.slice(0, 5) ?? '18:00'} />
                      </div>
                    )
                  })}
                  <button className="btn-gold mt-2 !py-2.5">Spara tider</button>
                </form>
              </details>

              <details className="border-t border-line">
                <summary className="cursor-pointer list-none px-5 py-3.5 text-sm font-medium">📲 Koppla till min kalender</summary>
                <div className="grid gap-3 px-5 pb-5 text-sm">
                  <a href={webcal} className="btn-ghost">🍎 Lägg till i Apple Kalender</a>
                  <a href={`https://calendar.google.com/calendar/r?cid=${encodeURIComponent(webcal)}`} target="_blank" rel="noreferrer" className="btn-ghost">
                    🟦 Lägg till i Google Kalender
                  </a>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 truncate rounded-xl bg-ink px-3 py-2 text-xs text-mute">{https}</code>
                    <CopyButton text={https} />
                  </div>
                  <p className="text-xs text-mute">
                    Öppna på telefonen. Nya bokningar dyker upp automatiskt (Apple: inom ca 15 min, Google kan ta några timmar).
                    Dela inte länken – den visar kundernas namn.
                  </p>
                </div>
              </details>

              <form action={deleteStaff} className="border-t border-line px-5 py-3">
                <input type="hidden" name="id" value={s.id} />
                <button className="text-xs text-red-300 hover:underline">Ta bort {s.name}</button>
              </form>
            </div>
          )
        })}

        <div className="card">
          <div className="px-5 pt-4 font-semibold">＋ Ny frisör</div>
          <StaffForm salonId={salon.id} />
        </div>
      </div>
    </div>
  )
}
