import Link from 'next/link'
import type { Currency } from '@/lib/types'
import { datePieces, formatMoney } from '@/lib/format'

/** Money as it appears in the app: currency code small, figure in the brand mono face. */
export function Money({ minor, currency, size = 'md' }: { minor: number; currency: Currency; size?: 'md' | 'lg' }) {
  return (
    <span className={`money money--${size}`}>
      <span className="money__ccy">{currency}</span>
      <span className="money__n">{formatMoney(minor)}</span>
    </span>
  )
}

const TONE: Record<string, string> = {
  paid: 'good', accepted: 'good',
  overdue: 'bad', declined: 'bad',
  'partly paid': 'warn',
  sent: 'neutral',
  draft: 'quiet', cancelled: 'quiet', expired: 'quiet',
}

export function Status({ status }: { status: string }) {
  return <span className={`pill pill--${TONE[status] ?? 'neutral'}`}>{status[0].toUpperCase() + status.slice(1)}</span>
}

/** "13 Oct 2026" for tables: compact, no superscript. */
export function ShortDate({ iso }: { iso: string | null }) {
  if (!iso) return <span className="muted">—</span>
  const p = datePieces(iso)
  const [month, year] = p.rest.split(' ')
  return <span className="nowrap">{p.day} {month.slice(0, 3)} {year}</span>
}

export function CurrencySwitch({ value, base }: { value: Currency; base: string }) {
  return (
    <div className="seg" role="group" aria-label="Currency">
      {(['MVR', 'USD'] as Currency[]).map((c) => (
        <Link key={c} href={c === 'MVR' ? base : `${base}?ccy=${c}`} className={c === value ? 'is-on' : undefined} aria-pressed={c === value}>
          {c}
        </Link>
      ))}
    </div>
  )
}

export function PageHead({ title, sub, children }: { title: string; sub?: string; children?: React.ReactNode }) {
  return (
    <header className="phead">
      <div>
        <h1>{title}</h1>
        {sub && <p>{sub}</p>}
      </div>
      {children && <div className="phead__end">{children}</div>}
    </header>
  )
}

export function Empty({ children }: { children: React.ReactNode }) {
  return <div className="empty">{children}</div>
}
