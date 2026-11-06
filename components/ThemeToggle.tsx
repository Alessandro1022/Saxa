'use client'

import { useEffect, useState } from 'react'

export default function ThemeToggle() {
  const [light, setLight] = useState(false)
  useEffect(() => setLight(document.documentElement.classList.contains('light')), [])

  function toggle() {
    const next = !light
    setLight(next)
    document.documentElement.classList.toggle('light', next)
    try {
      localStorage.setItem('theme', next ? 'light' : 'dark')
    } catch {}
  }

  return (
    <button
      onClick={toggle}
      aria-label={light ? 'Byt till mörkt läge' : 'Byt till ljust läge'}
      className="fixed right-4 top-4 z-30 flex h-10 w-10 items-center justify-center rounded-full border border-line bg-card/80 text-lg backdrop-blur transition hover:border-mute"
    >
      {light ? '🌙' : '☀️'}
    </button>
  )
}
