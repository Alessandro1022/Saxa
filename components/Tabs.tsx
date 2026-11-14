'use client'

import { Children, useState } from 'react'

/** Enkel flikväljare – visar ett barn i taget. */
export default function Tabs({ labels, children }: { labels: string[]; children: React.ReactNode }) {
  const [i, setI] = useState(0)
  const kids = Children.toArray(children)
  return (
    <div>
      <div className="mb-4 grid rounded-full p-1" style={{ gridTemplateColumns: `repeat(${labels.length}, 1fr)`, background: 'color-mix(in srgb, rgb(var(--fg)) 5%, rgb(var(--ink)))' }}>
        {labels.map((l, k) => (
          <button key={l} type="button" onClick={() => setI(k)} className={`rounded-full py-2.5 text-sm font-medium transition ${i === k ? 'bg-fg text-ink' : 'text-mute'}`}>
            {l}
          </button>
        ))}
      </div>
      {kids[i]}
    </div>
  )
}
