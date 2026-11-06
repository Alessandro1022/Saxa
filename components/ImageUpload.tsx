'use client'

import { useState } from 'react'
import { Camera, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export default function ImageUpload({
  name,
  folder,
  initial,
  shape = 'round',
  size = 80,
}: {
  name: string
  folder: string
  initial?: string | null
  shape?: 'round' | 'wide'
  size?: number
}) {
  const [url, setUrl] = useState(initial ?? '')
  const [busy, setBusy] = useState(false)

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) return alert('Max 5 MB')
    setBusy(true)
    const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
    const path = `${folder}/${crypto.randomUUID()}.${ext}`
    const supabase = createClient()
    const { error } = await supabase.storage.from('media').upload(path, file, { upsert: true, contentType: file.type })
    setBusy(false)
    if (error) return alert('Uppladdningen misslyckades. Har du kört 002_upgrade.sql?')
    setUrl(supabase.storage.from('media').getPublicUrl(path).data.publicUrl)
  }

  const box = shape === 'wide' ? 'h-32 w-full rounded-[24px]' : 'rounded-full'
  return (
    <label
      className={`group relative block shrink-0 cursor-pointer overflow-hidden ${box}`}
      style={{ ...(shape === 'round' ? { width: size, height: size } : {}), background: 'color-mix(in srgb, rgb(var(--fg)) 6%, rgb(var(--ink)))' }}
    >
      <input type="hidden" name={name} value={url} />
      <input type="file" accept="image/*" className="hidden" onChange={onFile} />
      {url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt="" className="h-full w-full object-cover" />
      )}
      <span
        className={`absolute inset-0 flex items-center justify-center text-mute transition ${
          url ? 'bg-black/40 text-white opacity-0 group-hover:opacity-100' : ''
        } ${busy ? '!opacity-100' : ''}`}
      >
        {busy ? <Loader2 size={20} className="animate-spin" /> : <Camera size={20} />}
      </span>
    </label>
  )
}
