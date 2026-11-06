import { Check, Star } from 'lucide-react'

/** 3D-lutad telefon som visar bokningsflödet. Ren CSS. */
export default function Phone3D() {
  return (
    <div className="relative mx-auto h-[470px] w-full max-w-[340px]" style={{ perspective: '1400px' }}>
      <div className="float absolute inset-0 flex items-center justify-center">
        <div
          className="relative h-[440px] w-[220px] rounded-[44px] p-[7px]"
          style={{
            transform: 'rotateY(-20deg) rotateX(10deg) rotateZ(3deg)',
            transformStyle: 'preserve-3d',
            background: 'linear-gradient(145deg, #3a3a40, #121214 55%, #2a2a2e)',
            boxShadow: '30px 40px 70px -20px rgb(0 0 0 / .55), inset 0 0 0 1px rgb(255 255 255 / .08), -8px 0 0 -2px #0d0d0f',
          }}
        >
          <div className="relative h-full overflow-hidden rounded-[38px] bg-[#0c0c0e] text-white">
            <div className="absolute left-1/2 top-2 z-10 h-5 w-20 -translate-x-1/2 rounded-full bg-black" />
            <div className="h-28" style={{ background: 'radial-gradient(circle at 30% 20%, #e8cf8f88, #1a1a1e 75%)' }} />
            <div className="-mt-7 px-4">
              <div className="h-12 w-12 rounded-full border-[3px] border-[#0c0c0e]" style={{ background: 'linear-gradient(160deg,#f3dfa9,#c99d4a)' }} />
              <div className="mt-2 text-[15px] font-bold">Fade Lab</div>
              <div className="flex items-center gap-1 text-[10px] text-white/60">
                <Star size={10} className="fill-[#e0bf78] text-[#e0bf78]" /> 4.9 · Göteborg
              </div>
              <div className="mt-3 flex gap-1.5">
                {['Idag', 'Lör', 'Sön', 'Mån'].map((d, i) => (
                  <div key={d} className={`flex h-11 w-9 flex-col items-center justify-center rounded-xl text-[8px] ${i === 0 ? 'bg-[#e0bf78] text-black' : 'bg-white/[.06] text-white/60'}`}>
                    {d}
                    <b className="text-[12px]">{6 + i}</b>
                  </div>
                ))}
              </div>
              <div className="mt-3 grid grid-cols-3 gap-1.5">
                {['10:00', '11:30', '13:15', '14:00', '15:45', '17:00'].map((t) => (
                  <div key={t} className={`rounded-full py-1.5 text-center text-[10px] font-semibold ${t === '13:15' ? 'bg-[#e0bf78] text-black' : 'bg-white/[.06]'}`}>{t}</div>
                ))}
              </div>
              <div className="mt-4 rounded-full py-2.5 text-center text-[11px] font-bold text-black" style={{ background: 'linear-gradient(180deg,#f0d99f,#d2ab5c)' }}>
                Boka 13:15
              </div>
            </div>
            <div className="pointer-events-none absolute inset-0 rounded-[38px]" style={{ background: 'linear-gradient(115deg, rgb(255 255 255 / .12), transparent 35%)' }} />
          </div>
        </div>
      </div>

      <div className="float-slow glass absolute left-0 top-16 flex items-center gap-2 rounded-full py-2 pl-2 pr-4 text-sm font-semibold sm:-left-6">
        <span className="flex h-7 w-7 items-center justify-center rounded-full text-ongold" style={{ background: 'linear-gradient(160deg,#f3dfa9,#c99d4a)' }}>
          <Check size={15} strokeWidth={3} />
        </span>
        Bokad · 13:15
      </div>
      <div className="float glass absolute bottom-20 right-0 flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold sm:-right-4">
        <Star size={15} className="fill-gold text-gold" /> 4.9 <span className="font-normal text-mute">· 120 omdömen</span>
      </div>
    </div>
  )
}
