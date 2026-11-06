import { Star } from 'lucide-react'

export function Avatar({
  name,
  src,
  size = 48,
  className = '',
}: {
  name: string
  src?: string | null
  size?: number
  className?: string
}) {
  return (
    <div
      className={`shrink-0 overflow-hidden rounded-full ${className}`}
      style={{ width: size, height: size, background: 'linear-gradient(135deg, rgb(var(--gold) / .35), rgb(var(--gold) / .08))' }}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt="" className="h-full w-full object-cover" />
      ) : (
        <div className="flex h-full items-center justify-center font-semibold text-gold" style={{ fontSize: size * 0.38 }}>
          {(name?.trim()?.[0] ?? '?').toUpperCase()}
        </div>
      )}
    </div>
  )
}

export function Rating({ avg, n, className = '' }: { avg?: number | null; n?: number | null; className?: string }) {
  if (!n) return <span className={`text-xs text-mute ${className}`}>Ny</span>
  return (
    <span className={`inline-flex items-center gap-1 text-sm font-medium ${className}`}>
      <Star size={14} className="fill-gold text-gold" />
      {avg?.toFixed(1)}
      <span className="font-normal text-mute">({n})</span>
    </span>
  )
}

export function Logo({ size = 40 }: { size?: number }) {
  return (
    <div
      className="flex items-center justify-center rounded-[30%] font-black text-ongold"
      style={{
        width: size,
        height: size,
        fontSize: size * 0.45,
        background: 'linear-gradient(160deg, #f3dfa9, #c99d4a)',
        boxShadow: '0 10px 24px -10px rgb(210 171 92 / .8)',
      }}
    >
      S
    </div>
  )
}

export function Flash({ e, ok }: { e?: string; ok?: string }) {
  if (e) return <p className="fade mb-4 rounded-2xl bg-red-500/10 px-4 py-3 text-sm text-red-400">{e}</p>
  if (ok) return <p className="fade mb-4 rounded-2xl bg-gold-soft px-4 py-3 text-sm text-gold">{ok}</p>
  return null
}
