/** 3456000 -> "34,560.00". Integer arithmetic only, so no float rounding ever reaches paper. */
export function formatMoney(minor: number): string {
  if (!Number.isInteger(minor)) throw new Error(`Money must be integer minor units, got ${minor}`)
  const sign = minor < 0 ? '-' : ''
  const abs = Math.abs(minor)
  const major = Math.floor(abs / 100).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  const cents = (abs % 100).toString().padStart(2, '0')
  return `${sign}${major}.${cents}`
}

/** 1 -> "1", 2.5 -> "2.5", 1.25 -> "1.25" */
export function formatQuantity(q: number): string {
  return Number.isInteger(q) ? String(q) : String(Math.round(q * 100) / 100)
}

/** 800 -> "8%", 650 -> "6.5%" */
export function formatRate(bps: number): string {
  return `${Math.round(bps) / 100}%`
}

/** 10 -> "#010", null -> "DRAFT". Never resets; grows past three digits naturally. */
export function formatDocNumber(n: number | null): string {
  return n == null ? 'DRAFT' : `#${String(n).padStart(3, '0')}`
}

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

export function ordinalSuffix(day: number): string {
  const t = day % 100
  if (t >= 11 && t <= 13) return 'th'
  return ({ 1: 'st', 2: 'nd', 3: 'rd' } as Record<number, string>)[day % 10] ?? 'th'
}

/** "2026-07-19" -> { day: "19", suffix: "th", rest: "July 2026" }. Parsed as a plain date, no time zones. */
export function datePieces(iso: string): { day: string; suffix: string; rest: string } {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso)
  if (!m) throw new Error(`Expected YYYY-MM-DD, got ${iso}`)
  const [, y, mo, d] = m
  const day = Number(d), month = Number(mo)
  if (month < 1 || month > 12 || day < 1 || day > 31) throw new Error(`Invalid date ${iso}`)
  return { day: String(day), suffix: ordinalSuffix(day), rest: `${MONTHS[month - 1]} ${y}` }
}
