'use client'

import { useFormStatus } from 'react-dom'
import { Loader2 } from 'lucide-react'

/** Knapp som visar att något händer medan formuläret skickas. */
export default function SubmitButton({ children, pending: label = 'Vänta…', className = 'btn-gold' }: { children: React.ReactNode; pending?: string; className?: string }) {
  const { pending } = useFormStatus()
  return (
    <button type="submit" disabled={pending} aria-busy={pending} className={className}>
      {pending ? (
        <>
          <Loader2 size={18} className="animate-spin" /> {label}
        </>
      ) : (
        children
      )}
    </button>
  )
}
