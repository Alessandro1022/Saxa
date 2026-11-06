'use client'

import { useEffect, useState } from 'react'
import { Moon, Sun } from 'lucide-react'

export default function ThemeToggle({ className = '' }: { className?: string }) {
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
    <button onClick={toggle} aria-label={light ? 'Mörkt läge' : 'Ljust läge'} className={`icon-btn ${className}`}>
      {light ? <Moon size={18} /> : <Sun size={18} />}
    </button>
  )
}
