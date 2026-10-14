/**
 * Parse what someone types into a money field ("1,234.5", "1234.50", " 32000 ") into integer minor units.
 * String arithmetic only, so 0.1 + 0.2 style float errors can never reach a document.
 * Returns null for anything that isn't a plain non-negative amount with at most two decimals.
 */
export function parseMoney(input: string): number | null {
  const s = input.trim().replace(/,/g, '')
  if (!/^\d+(\.\d{0,2})?$/.test(s)) return null
  const [whole, frac = ''] = s.split('.')
  const minor = Number(whole) * 100 + Number(frac.padEnd(2, '0'))
  // Cap at one trillion (MVR or USD) to catch runaway typos.
  return Number.isSafeInteger(minor) && minor <= 100_000_000_000_000 ? minor : null
}

/** 3456000 -> "34560.00" for an input's value attribute. */
export function moneyToInput(minor: number): string {
  return `${Math.floor(minor / 100)}.${String(minor % 100).padStart(2, '0')}`
}

/** Quantities: positive, up to two decimals ("1", "2.5", "0.25"). */
export function parseQuantity(input: string): number | null {
  const s = input.trim().replace(/,/g, '')
  if (!/^\d+(\.\d{1,2})?$/.test(s)) return null
  const q = Number(s)
  return q > 0 && q <= 1_000_000 ? q : null
}

/** "8" or "8.5" -> basis points (800, 850). */
export function parseRate(input: string): number | null {
  const s = input.trim().replace('%', '')
  if (!/^\d{1,2}(\.\d{1,2})?$/.test(s)) return null
  const [w, f = ''] = s.split('.')
  return Number(w) * 100 + Number(f.padEnd(2, '0'))
}

export const isIsoDate = (s: string) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false
  const d = new Date(s + 'T00:00:00Z')
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s
}

export function addDays(iso: string, days: number): string {
  const d = new Date(iso + 'T00:00:00Z')
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().slice(0, 10)
}
