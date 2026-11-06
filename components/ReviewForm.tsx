'use client'

import { useState } from 'react'
import { Star } from 'lucide-react'
import { addReview } from '@/app/me/actions'

export default function ReviewForm({ bookingId }: { bookingId: string }) {
  const [rating, setRating] = useState(0)
  const [hover, setHover] = useState(0)
  return (
    <form action={addReview} className="mt-3 rounded-[20px] p-3" style={{ background: 'rgb(var(--fg) / .04)' }}>
      <input type="hidden" name="booking_id" value={bookingId} />
      <input type="hidden" name="rating" value={rating} />
      <div className="flex items-center justify-between">
        <span className="text-sm text-mute">Hur var besöket?</span>
        <div className="flex gap-1" onMouseLeave={() => setHover(0)}>
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              onMouseEnter={() => setHover(n)}
              onClick={() => setRating(n)}
              className="p-0.5 transition active:scale-90"
              aria-label={`${n} stjärnor`}
            >
              <Star size={24} className={(hover || rating) >= n ? 'fill-gold text-gold' : 'text-mute/50'} />
            </button>
          ))}
        </div>
      </div>
      {rating > 0 && (
        <div className="fade mt-3 flex gap-2">
          <input name="comment" className="input !py-2.5" placeholder="Skriv en kommentar (valfritt)" />
          <button className="btn-gold !px-5 !py-2.5 text-sm">Skicka</button>
        </div>
      )}
    </form>
  )
}
