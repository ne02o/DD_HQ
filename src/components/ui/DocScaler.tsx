'use client'
import { useEffect, useRef } from 'react'

const A4_PX = (210 / 25.4) * 96 // 210mm at 96dpi

/**
 * Fits the A4 page to narrow screens by scaling it as a picture (transform), and sizes the frame to the
 * scaled height so nothing below it overlaps. Screen only; printing uses the real size.
 */
export default function DocScaler({ children }: { children: React.ReactNode }) {
  const outer = useRef<HTMLDivElement>(null)
  const inner = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const o = outer.current, i = inner.current
    if (!o || !i) return
    const fit = () => {
      const z = Math.min(1, o.clientWidth / A4_PX)
      o.style.setProperty('--doc-zoom', String(z))
      o.style.setProperty('--doc-h', `${Math.ceil(i.offsetHeight * z) + 8}px`)
      if (z < 1) o.setAttribute('data-scaled', '')
      else o.removeAttribute('data-scaled')
    }
    fit()
    const ro = new ResizeObserver(fit)
    ro.observe(o)
    ro.observe(i)
    return () => ro.disconnect()
  }, [])
  return (
    <div ref={outer} className="docview__paper">
      <div ref={inner} className="docview__scale">{children}</div>
    </div>
  )
}
