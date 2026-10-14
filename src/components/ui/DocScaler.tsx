'use client'
import { useEffect, useRef } from 'react'

const A4_PX = (210 / 25.4) * 96 // 210mm at 96dpi

/** Shrinks the A4 page to fit narrow screens. Print is unaffected (the zoom is screen-only CSS). */
export default function DocScaler({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const fit = () => el.style.setProperty('--doc-zoom', String(Math.min(1, el.clientWidth / A4_PX)))
    fit()
    const ro = new ResizeObserver(fit)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  return <div ref={ref} className="docview__paper">{children}</div>
}
