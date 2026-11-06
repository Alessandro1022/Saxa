'use client'

import { useState } from 'react'

export default function CopyButton({ text, label = 'Kopiera' }: { text: string; label?: string }) {
  const [done, setDone] = useState(false)
  return (
    <button
      type="button"
      className="btn-ghost !px-3 !py-2 text-sm"
      onClick={() => {
        navigator.clipboard.writeText(text)
        setDone(true)
        setTimeout(() => setDone(false), 1500)
      }}
    >
      {done ? 'Kopierat ✓' : label}
    </button>
  )
}
