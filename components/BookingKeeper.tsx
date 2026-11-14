'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export const DEVICE_KEY = 'saxa_bookings'

export function deviceTokens(): string[] {
  try {
    const v = JSON.parse(localStorage.getItem(DEVICE_KEY) ?? '[]')
    return Array.isArray(v) ? v.filter((t) => typeof t === 'string') : []
  } catch {
    return []
  }
}

/**
 * Sparar bokningen på enheten (så att den syns under Bokningar även utan konto)
 * och uppdaterar sidan när man kommer tillbaka från t.ex. Swish.
 */
export default function BookingKeeper({ token }: { token: string }) {
  const router = useRouter()
  useEffect(() => {
    try {
      const list = [token, ...deviceTokens().filter((t) => t !== token)].slice(0, 30)
      localStorage.setItem(DEVICE_KEY, JSON.stringify(list))
    } catch {}
    const onVis = () => !document.hidden && router.refresh()
    document.addEventListener('visibilitychange', onVis)
    return () => document.removeEventListener('visibilitychange', onVis)
  }, [token, router])
  return null
}
