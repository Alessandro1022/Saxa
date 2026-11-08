import CustomerNav from './CustomerNav'

/** Skelett som visas direkt när man trycker – sidan känns omedelbar medan datan laddas. */
export function Bone({ className = '', style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <div
      className={`animate-pulse rounded-[22px] ${className}`}
      style={{ background: 'color-mix(in srgb, rgb(var(--fg)) 7%, rgb(var(--ink)))', ...style }}
    />
  )
}

export function PageSkeleton({ title, variant = 'list' }: { title?: string; variant?: 'list' | 'cards' | 'hero' | 'salon' | 'form' }) {
  return (
    <main className="mx-auto max-w-2xl px-5 pb-32 pt-[max(env(safe-area-inset-top),20px)]">
      {variant !== 'salon' && (
        <div className="flex items-center gap-3 pt-2">
          {title ? <h1 className="flex-1 text-[28px] font-bold tracking-tight">{title}</h1> : <Bone className="h-10 w-10 !rounded-full" />}
          {!title && <div className="flex-1" />}
          <Bone className="h-11 w-11 !rounded-full" />
          <Bone className="h-11 w-11 !rounded-full" />
        </div>
      )}
      {variant === 'hero' && (
        <div className="mt-10 space-y-3">
          <Bone className="h-7 w-40 !rounded-full" />
          <Bone className="h-12 w-11/12" />
          <Bone className="h-12 w-3/4" />
          <Bone className="mt-6 h-14 w-full !rounded-full" />
          <Bone className="h-14 w-full !rounded-full" />
        </div>
      )}
      {variant === 'cards' && (
        <div className="mt-6 space-y-4">
          <Bone className="h-[52px] w-full !rounded-full" />
          <div className="flex gap-2">
            <Bone className="h-10 w-32 !rounded-full" />
            <Bone className="h-10 w-28 !rounded-full" />
          </div>
          {[0, 1, 2].map((i) => (
            <Bone key={i} className="h-44 w-full !rounded-[28px]" />
          ))}
        </div>
      )}
      {variant === 'list' && (
        <div className="mt-6 space-y-3">
          <Bone className="h-4 w-24" />
          <Bone className="h-48 w-full !rounded-[28px]" />
          <Bone className="h-20 w-full !rounded-[28px]" />
          <Bone className="h-20 w-full !rounded-[28px]" />
        </div>
      )}
      {variant === 'form' && (
        <div className="mt-6 space-y-3">
          <Bone className="h-28 w-full !rounded-[28px]" />
          <Bone className="h-14 w-full" />
          <Bone className="h-14 w-full" />
          <Bone className="h-14 w-full !rounded-full" />
        </div>
      )}
      {variant === 'salon' && (
        <div className="-mx-5 -mt-5">
          <Bone className="h-[300px] w-full !rounded-none" />
          <div className="-mt-16 space-y-3 px-5">
            <Bone className="h-[84px] w-[84px] !rounded-full" />
            <Bone className="h-9 w-2/3" />
            <Bone className="h-4 w-1/2" />
            <div className="flex gap-3 pt-6">
              {[0, 1, 2].map((i) => (
                <Bone key={i} className="h-40 w-[132px]" />
              ))}
            </div>
            <Bone className="mt-6 h-20 w-full" />
            <Bone className="h-20 w-full" />
          </div>
        </div>
      )}
      {variant !== 'salon' && <CustomerNav />}
    </main>
  )
}
