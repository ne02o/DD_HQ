import type { LineItem } from './types'

export type Totals = {
  lines: (LineItem & { total: number })[]
  subtotal: number
  taxableBase: number
  gst: number
  total: number
  hasExempt: boolean
}

/**
 * The single source of truth for document arithmetic. All values are integer minor units.
 * GST applies only to taxable lines and is rounded once, on the taxable base, to the nearest laari.
 */
export function computeTotals(items: LineItem[], gstRateBps: number): Totals {
  const lines = items.map((it) => {
    if (!Number.isInteger(it.unitPrice)) throw new Error(`unitPrice must be integer minor units: ${it.description}`)
    return { ...it, total: Math.round(it.quantity * it.unitPrice) }
  })
  const subtotal = lines.reduce((s, l) => s + l.total, 0)
  const taxableBase = lines.filter((l) => l.taxable).reduce((s, l) => s + l.total, 0)
  const gst = Math.round((taxableBase * gstRateBps) / 10000)
  const hasExempt = lines.some((l) => !l.taxable) && lines.some((l) => l.taxable)
  return { lines, subtotal, taxableBase, gst, total: subtotal + gst, hasExempt }
}
