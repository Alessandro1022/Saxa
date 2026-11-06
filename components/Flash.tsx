export default function Flash({ e, ok }: { e?: string; ok?: string }) {
  if (e) return <p className="mb-4 rounded-2xl border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-300">{e}</p>
  if (ok) return <p className="mb-4 rounded-2xl border border-gold/40 bg-gold-soft p-3 text-sm text-gold">{ok}</p>
  return null
}
