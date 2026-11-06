import { Star } from 'lucide-react'
import { requireSalon, origin } from '@/lib/salon'
import { admin } from '@/lib/supabase/admin'
import { saveSalon } from '../actions'
import ImageUpload from '@/components/ImageUpload'
import CopyButton from '@/components/CopyButton'
import { Avatar, Flash } from '@/components/ui'

export default async function Settings({ searchParams }: { searchParams: Promise<{ e?: string; ok?: string }> }) {
  const sp = await searchParams
  const { salon } = await requireSalon()
  const link = `${await origin()}/${salon.slug}`
  const db = admin()
  const { data: reviews } = await db
    .from('reviews')
    .select('id, rating, comment, customer_id, created_at')
    .eq('salon_id', salon.id)
    .order('created_at', { ascending: false })
    .limit(20)
  const ids = [...new Set((reviews ?? []).map((r) => r.customer_id as string))]
  const { data: people } = ids.length ? await db.from('customers').select('id, full_name, avatar_url').in('id', ids) : { data: [] }
  const avg = reviews?.length ? reviews.reduce((a, r) => a + r.rating, 0) / reviews.length : null

  return (
    <div>
      <h1 className="rise mb-5 text-[26px] font-bold tracking-tight">Salong</h1>
      <Flash e={sp.e} ok={sp.ok ? 'Sparat ✓' : undefined} />

      <div className="card rise mb-4 p-5">
        <div className="label">Din bokningslänk</div>
        <div className="flex items-center gap-2">
          <code className="flex-1 truncate rounded-full px-4 py-2.5 text-sm" style={{ background: 'rgb(var(--fg) / .05)' }}>{link}</code>
          <CopyButton text={link} />
        </div>
        <p className="mt-2 text-xs text-mute">Lägg den i Instagram-bion, på Google-profilen och skicka den i DM.</p>
      </div>

      <form action={saveSalon} className="card rise rise-1 grid gap-4 p-5">
        <div>
          <label className="label">Omslagsbild</label>
          <ImageUpload name="cover_url" folder={salon.id} initial={salon.cover_url} shape="wide" />
        </div>
        <div className="flex items-end gap-4">
          <div>
            <label className="label">Logga</label>
            <ImageUpload name="logo_url" folder={salon.id} initial={salon.logo_url} size={72} />
          </div>
          <div className="flex-1">
            <label className="label">Namn</label>
            <input className="input" name="name" defaultValue={salon.name} required />
          </div>
        </div>
        <div>
          <label className="label">Länk</label>
          <input className="input" name="slug" defaultValue={salon.slug} required pattern="[a-z0-9\-]{3,40}" />
        </div>
        <div>
          <label className="label">Beskrivning</label>
          <textarea className="input min-h-[84px] resize-none" name="description" defaultValue={salon.description ?? ''} placeholder="Fades, skägg och klassiska klipp." />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <label className="label">Adress</label>
            <input className="input" name="address" defaultValue={salon.address ?? ''} />
          </div>
          <div>
            <label className="label">Stad</label>
            <input className="input" name="city" defaultValue={salon.city ?? ''} placeholder="Göteborg" />
          </div>
          <div>
            <label className="label">Telefon</label>
            <input className="input" name="phone" defaultValue={salon.phone ?? ''} />
          </div>
          <div className="col-span-2">
            <label className="label">Instagram</label>
            <input className="input" name="instagram" defaultValue={salon.instagram ?? ''} placeholder="dittkonto" />
          </div>
        </div>
        <button className="btn-gold">Spara</button>
      </form>

      <section className="mt-8">
        <h2 className="mb-3 flex items-center gap-2 text-sm font-medium text-mute">
          <Star size={14} className="fill-gold text-gold" />
          {avg ? `${avg.toFixed(1)} · ${reviews!.length} omdömen` : 'Inga omdömen än'}
        </h2>
        {!!reviews?.length && (
          <div className="card divide-hair overflow-hidden">
            {reviews.map((r) => {
              const p = (people ?? []).find((x) => x.id === r.customer_id)
              const who = p?.full_name?.split(' ')[0] ?? 'Kund'
              return (
                <div key={r.id} className="flex gap-3 px-4 py-3.5">
                  <Avatar name={who} src={p?.avatar_url} size={36} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      {who}
                      <span className="flex">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star key={i} size={11} className={i < r.rating ? 'fill-gold text-gold' : 'text-mute/40'} />
                        ))}
                      </span>
                    </div>
                    {r.comment && <p className="text-sm text-mute">{r.comment}</p>}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}
