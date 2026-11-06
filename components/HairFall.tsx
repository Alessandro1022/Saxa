'use client'

import { useEffect, useRef } from 'react'

type Strand = { x: number; y: number; len: number; curl: number; a: number; va: number; vy: number; ph: number; w: number; gold: boolean; o: number }

/** Hårstrån som sakta faller och svajar i bakgrunden. */
export default function HairFall({ count = 26 }: { count?: number }) {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const c = ref.current
    if (!c) return
    const ctx = c.getContext('2d')
    if (!ctx) return
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches
    let w = 0
    let h = 0
    let raf = 0
    const dpr = Math.min(devicePixelRatio || 1, 2)

    const resize = () => {
      const r = c.getBoundingClientRect()
      w = r.width
      h = r.height
      c.width = w * dpr
      c.height = h * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    resize()

    const make = (top = false): Strand => ({
      x: Math.random() * w,
      y: top ? -40 - Math.random() * 80 : Math.random() * h,
      len: 12 + Math.random() * 26,
      curl: (Math.random() - 0.5) * 22,
      a: Math.random() * Math.PI * 2,
      va: (Math.random() - 0.5) * 0.012,
      vy: 0.25 + Math.random() * 0.55,
      ph: Math.random() * Math.PI * 2,
      w: 0.8 + Math.random() * 1.1,
      gold: Math.random() < 0.55,
      o: 0.18 + Math.random() * 0.32,
    })
    const strands = Array.from({ length: count }, () => make())

    const color = () => {
      const s = getComputedStyle(document.documentElement)
      return { gold: s.getPropertyValue('--gold').trim().replace(/ /g, ','), fg: s.getPropertyValue('--fg').trim().replace(/ /g, ',') }
    }
    let col = color()
    const mo = new MutationObserver(() => (col = color()))
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })

    const draw = (t: number) => {
      ctx.clearRect(0, 0, w, h)
      for (const s of strands) {
        if (!reduce) {
          s.y += s.vy
          s.x += Math.sin(t * 0.0009 + s.ph) * 0.35
          s.a += s.va + Math.sin(t * 0.001 + s.ph) * 0.002
          if (s.y > h + 50) Object.assign(s, make(true))
        }
        ctx.save()
        ctx.translate(s.x, s.y)
        ctx.rotate(s.a)
        ctx.beginPath()
        ctx.moveTo(0, -s.len / 2)
        ctx.bezierCurveTo(s.curl, -s.len / 6, -s.curl * 0.6, s.len / 6, s.curl * 0.3, s.len / 2)
        ctx.lineCap = 'round'
        ctx.lineWidth = s.w
        ctx.strokeStyle = s.gold ? `rgba(${col.gold},${s.o})` : `rgba(${col.fg},${s.o * 0.5})`
        ctx.stroke()
        ctx.restore()
      }
      if (!reduce) raf = requestAnimationFrame(draw)
    }
    raf = requestAnimationFrame(draw)

    const ro = new ResizeObserver(resize)
    ro.observe(c)
    const vis = () => {
      cancelAnimationFrame(raf)
      if (!document.hidden) raf = requestAnimationFrame(draw)
    }
    document.addEventListener('visibilitychange', vis)
    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
      mo.disconnect()
      document.removeEventListener('visibilitychange', vis)
    }
  }, [count])

  return <canvas ref={ref} aria-hidden className="pointer-events-none absolute inset-0 h-full w-full" />
}
