'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function ImageUpload({
  name,
  salonId,
  initial,
  shape = 'square',
}: {
  name: string
  salonId: string
  initial?: string | null
  shape?: 'square' | 'wide'
}) {
  const [url, setUrl] = useState(initial ?? '')
  const [busy, setBusy] = useState(false)

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) return alert('Max 5 MB')
    setBusy(true)
    const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
    const path = `${salonId}/${crypto.randomUUID()}.${ext}`
    const supabase = createClient()
    const { error } = await supabase.storage.from('media').upload(path, file, { upsert: true, contentType: file.type })
    setBusy(false)
    if (error) return alert('Uppladdningen misslyckades')
    setUrl(supabase.storage.from('media').getPublicUrl(path).data.publicUrl)
  }

  const box = shape === 'wide' ? 'h-24 w-full' : 'h-20 w-20'
  return (
    <label className={`relative block ${box} cursor-pointer overflow-hidden rounded-2xl border border-dashed border-line bg-ink hover:border-mute`}>
      <input type="hidden" name={name} value={url} />
      <input type="file" accept="image/*" className="hidden" onChange={onFile} />
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt="" className="h-full w-full object-cover" />
      ) : (
        <span className="flex h-full items-center justify-center text-xs text-mute">{busy ? 'Laddar…' : '+ Bild'}</span>
      )}
      {busy && url && <span className="absolute inset-0 flex items-center justify-center bg-ink/70 text-xs">Laddar…</span>}
    </label>
  )
}
