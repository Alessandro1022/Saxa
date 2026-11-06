import { requireSalon, origin } from '@/lib/salon'
import { saveSalon } from '../actions'
import ImageUpload from '@/components/ImageUpload'
import CopyButton from '@/components/CopyButton'
import Flash from '@/components/Flash'

export default async function Settings({ searchParams }: { searchParams: Promise<{ e?: string; ok?: string }> }) {
  const sp = await searchParams
  const { salon } = await requireSalon()
  const link = `${await origin()}/${salon.slug}`

  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold">Salong</h1>
      <Flash e={sp.e} ok={sp.ok ? 'Sparat ✓' : undefined} />

      <div className="card mb-6 p-5">
        <div className="label">Din bokningslänk</div>
        <div className="flex items-center gap-2">
          <code className="flex-1 truncate rounded-xl bg-ink px-3 py-2 text-sm">{link}</code>
          <CopyButton text={link} />
        </div>
        <p className="mt-2 text-xs text-mute">Lägg den i Instagram-bion, Google-profilen och svara med den i DM.</p>
      </div>

      <form action={saveSalon} className="card grid gap-4 p-5">
        <div>
          <label className="label">Omslagsbild</label>
          <ImageUpload name="cover_url" salonId={salon.id} initial={salon.cover_url} shape="wide" />
        </div>
        <div className="flex items-end gap-4">
          <div>
            <label className="label">Logga</label>
            <ImageUpload name="logo_url" salonId={salon.id} initial={salon.logo_url} />
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
          <textarea className="input min-h-[80px]" name="description" defaultValue={salon.description ?? ''} placeholder="Fades, skägg och klassiska klipp." />
        </div>
        <div>
          <label className="label">Adress</label>
          <input className="input" name="address" defaultValue={salon.address ?? ''} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Telefon</label>
            <input className="input" name="phone" defaultValue={salon.phone ?? ''} />
          </div>
          <div>
            <label className="label">Instagram</label>
            <input className="input" name="instagram" defaultValue={salon.instagram ?? ''} placeholder="dittkonto" />
          </div>
        </div>
        <button className="btn-gold">Spara</button>
      </form>
    </div>
  )
}
