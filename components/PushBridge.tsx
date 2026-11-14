'use client'

import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'

declare global {
  interface Window {
    __SAXA_PUSH__?: string
  }
}

/** I iOS-appen: kopplar telefonens push-adress till den inloggade och till bokningar som visas. */
export default function PushBridge() {
  const path = usePathname()
  const sent = useRef(new Set<string>())

  useEffect(() => {
    const send = () => {
      const t = window.__SAXA_PUSH__
      if (!t) return
      const bookingToken = path.match(/^\/b\/([0-9a-f-]{36})/i)?.[1]
      // En gång per sidladdning, och en gång per bokning / inloggat område
      const key = bookingToken ?? (path.startsWith('/dashboard') ? 'dash' : path.startsWith('/me') ? 'me' : 'base')
      if (sent.current.has(key)) return
      sent.current.add(key)
      fetch('/api/push/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ expoToken: t, bookingToken }),
      }).catch(() => sent.current.delete(key))
    }
    send()
    window.addEventListener('saxa-push', send)
    return () => window.removeEventListener('saxa-push', send)
  }, [path])

  return null
}
