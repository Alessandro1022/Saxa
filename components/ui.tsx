import { Star } from 'lucide-react'

export { Avatar } from './Img'

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
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/logo.svg"
      alt="Saxa"
      width={size}
      height={size}
      className="shrink-0 rounded-[22%]"
      style={{ boxShadow: '0 10px 24px -12px rgb(0 0 0 / .6)' }}
    />
  )
}

export function Flash({ e, ok }: { e?: string; ok?: string }) {
  if (e) return <p className="fade mb-4 rounded-2xl bg-red-500/10 px-4 py-3 text-sm text-red-400">{e}</p>
  if (ok) return <p className="fade mb-4 rounded-2xl bg-gold-soft px-4 py-3 text-sm text-gold">{ok}</p>
  return null
}
