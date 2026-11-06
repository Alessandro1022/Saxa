import { CalendarSync, Clock, Trash2 } from 'lucide-react'
import SubmitButton from '@/components/SubmitButton'
import { requireSalon, origin } from '@/lib/salon'
import { saveStaff, deleteStaff, saveHours } from '../actions'
import { WEEKDAYS, WEEK_ORDER } from '@/lib/time'
import ImageUpload from '@/components/ImageUpload'
import CopyButton from '@/components/CopyButton'
import Sheet from '@/components/Sheet'
import { Flash } from '@/components/ui'

type Staff = { id: string; name: string; title: string | null; bio: string | null; photo_url: string | null; active: boolean; ical_token: string }
type H = { staff_id: string; weekday: number; start_time: string; end_time: string }

function StaffForm({ s, salonId }: { s?: Staff; salonId: string }) {
  return (
    <form action={saveStaff} className="grid gap-3">
      {s && <input type="hidden" name="id" value={s.id} />}
      <div className="flex items-center gap-4">
        <ImageUpload name="photo_url" folder={salonId} initial={s?.photo_url} size={76} />
        <div className="grid flex-1 gap-2.5">
          <input className="input" name="name" defaultValue={s?.name} placeholder="Namn" required />
          <input className="input" name="title" defaultValue={s?.title ?? ''} placeholder="Titel, t.ex. Barber" />
        </div>
      </div>
      <input className="input" name="bio" defaultValue={s?.bio ?? ''} placeholder="Kort om dig, t.ex. Fade-specialist" />
      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2.5 text-sm">
          <input type="checkbox" name="active" defaultChecked={s?.active ?? true} className="h-5 w-5 accent-[#d2ab5c]" /> Tar bokningar
        </label>
        <SubmitButton className="btn-gold !py-3" pending="Sparar…">{s ? 'Spara' : 'Lägg till'}</SubmitButton>
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
      <h1 className="rise mb-1 text-[26px] font-bold tracking-tight">Team</h1>
      <p className="rise mb-5 text-sm text-mute">Bilder, arbetstider och kalenderkoppling.</p>
      <Flash e={e} />
      <div className="grid gap-4">
        {((staff ?? []) as Staff[]).map((s, i) => {
          const h = ((hours ?? []) as H[]).filter((x) => x.staff_id === s.id)
          const webcal = `webcal://${host}/api/ical/${s.ical_token}.ics`
          const https = `${base}/api/ical/${s.ical_token}.ics`
          const openDays = WEEK_ORDER.filter((d) => h.some((x) => x.weekday === d))
          return (
            <div key={s.id} className="card rise overflow-hidden p-5" style={{ animationDelay: `${i * 0.04}s` }}>
              <StaffForm s={s} salonId={salon.id} />

              <details className="mt-4 rounded-[22px]" style={{ background: 'color-mix(in srgb, rgb(var(--fg)) 4%, rgb(var(--ink)))' }}>
                <summary className="flex cursor-pointer list-none items-center gap-3 px-4 py-3.5">
                  <Clock size={17} className="text-gold" />
                  <span className="flex-1 text-sm font-medium">Arbetstider</span>
                  <span className="text-xs text-mute">{openDays.map((d) => WEEKDAYS[d]).join(' ') || 'Inga'}</span>
                </summary>
                <form action={saveHours} className="grid gap-2 px-4 pb-4">
                  <input type="hidden" name="staff_id" value={s.id} />
                  {WEEK_ORDER.map((d) => {
                    const row = h.find((x) => x.weekday === d)
                    return (
                      <div key={d} className="flex items-center gap-2">
                        <label className="relative">
                          <input type="checkbox" name={`open_${d}`} defaultChecked={!!row} className="peer sr-only" />
                          <span className="flex h-11 w-14 cursor-pointer items-center justify-center rounded-full text-sm font-semibold text-mute transition peer-checked:bg-gold peer-checked:text-ongold" style={{ background: 'color-mix(in srgb, rgb(var(--fg)) 6%, rgb(var(--ink)))' }}>
                            {WEEKDAYS[d]}
                          </span>
                        </label>
                        <input className="input !py-2.5" type="time" name={`start_${d}`} defaultValue={row?.start_time.slice(0, 5) ?? '10:00'} />
                        <span className="text-mute">–</span>
                        <input className="input !py-2.5" type="time" name={`end_${d}`} defaultValue={row?.end_time.slice(0, 5) ?? '18:00'} />
                      </div>
                    )
                  })}
                  <SubmitButton className="btn-gold mt-2 !py-3" pending="Sparar…">Spara tider</SubmitButton>
                </form>
              </details>

              <details className="mt-2 rounded-[22px]" style={{ background: 'color-mix(in srgb, rgb(var(--fg)) 4%, rgb(var(--ink)))' }}>
                <summary className="flex cursor-pointer list-none items-center gap-3 px-4 py-3.5">
                  <CalendarSync size={17} className="text-gold" />
                  <span className="flex-1 text-sm font-medium">Koppla till min kalender</span>
                </summary>
                <div className="grid gap-2.5 px-4 pb-4 text-sm">
                  <div className="grid grid-cols-2 gap-2">
                    <a href={webcal} className="btn-soft !py-3 text-sm">Apple</a>
                    <a href={`https://calendar.google.com/calendar/r?cid=${encodeURIComponent(webcal)}`} target="_blank" rel="noreferrer" className="btn-soft !py-3 text-sm">Google</a>
                  </div>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 truncate rounded-full px-4 py-2.5 text-xs text-mute" style={{ background: 'color-mix(in srgb, rgb(var(--fg)) 5%, rgb(var(--ink)))' }}>{https}</code>
                    <CopyButton text={https} />
                  </div>
                  <p className="text-xs text-mute">Öppna på telefonen. Bokningar dyker upp automatiskt (Apple ca 15 min, Google några timmar). Dela inte länken.</p>
                </div>
              </details>

              <form action={deleteStaff} className="mt-3">
                <input type="hidden" name="id" value={s.id} />
                <button className="flex items-center gap-1.5 text-xs text-red-400"><Trash2 size={13} /> Ta bort {s.name}</button>
              </form>
            </div>
          )
        })}
      </div>

      <Sheet title="Ny frisör">
        <StaffForm salonId={salon.id} />
      </Sheet>
    </div>
  )
}
