import { Bone } from '@/components/Skeleton'

// Visas inuti panelens layout (header och meny ligger kvar)
export default function Loading() {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-2.5">
        {[0, 1, 2].map((i) => (
          <Bone key={i} className="h-[92px] !rounded-[28px]" />
        ))}
      </div>
      <Bone className="mt-4 h-8 w-40" />
      <div className="flex gap-2">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <Bone key={i} className="h-[74px] w-[54px] shrink-0" />
        ))}
      </div>
      <Bone className="h-[72px] w-full !rounded-[28px]" />
      <Bone className="h-[72px] w-full !rounded-[28px]" />
    </div>
  )
}
