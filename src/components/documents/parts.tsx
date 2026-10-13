import type { ReactNode } from 'react'
import type { Company, Currency } from '@/lib/types'
import { datePieces, formatMoney, formatQuantity, formatRate } from '@/lib/format'
import type { Totals } from '@/lib/totals'

/** The d² mark, inlined so it prints even with no image files available. */
export function Mark() {
  return (
    <svg className="doc__mark" viewBox="0 0 393.97 393.97" aria-label="Digital Dive" role="img">
      <rect x="0" y="0" width="393.97" height="393.97" rx="196.98" ry="196.98" fill="currentColor" />
      <g fill="#fff">
        <path d="M163.46,292.06c.76,0,1.51-.03,2.26-.07.73.02,1.46.04,2.19.04,11.27,0,21.87-2.81,31.17-7.75v7.92h53.25v-31.53h-17.65V101.77h-56.72v31.53h21.13v33.6c-9.3-4.95-19.9-7.75-31.17-7.75-36.7,0-66.44,29.75-66.44,66.44,0,11.1,2.72,21.55,7.53,30.75,10.34,21.13,31.2,35.72,54.46,35.72ZM167.92,194.36c.33,0,.65.01.97.02,16.8.52,30.26,14.29,30.26,31.21s-13.98,31.23-31.23,31.23c-8.44,0-16.1-3.36-21.72-8.8-5.86-5.68-9.51-13.63-9.51-22.43,0-17.25,13.98-31.23,31.23-31.23Z" />
        <path d="M281.2,138.13c6.97-5.82,11.29-11.03,11.29-19.06,0-9.71-8.3-17.3-19.59-17.3-10.5,0-19.33,7.24-20.66,17.92l11.21,2.03c.62-5.39,3.97-8.65,8.48-8.65s7.33,3.27,7.33,6.71c0,3.88-2.47,7.59-6.8,11.48l-20.13,17.93v9.97h40.16v-10.94h-23.31l12.01-10.07Z" />
      </g>
    </svg>
  )
}

/** "19th July 2026" with the suffix as superscript. */
export function DocDate({ iso }: { iso: string }) {
  const p = datePieces(iso)
  return <span className="nowrap">{p.day}<sup>{p.suffix}</sup> {p.rest}</span>
}

/** Label–value stack used by the billing, bank and terms blocks. */
export function Rows({ rows }: { rows: [string, ReactNode][] }) {
  return (
    <dl className="rows">
      {rows.map(([label, value]) => (
        <div className="rows__row" key={label}>
          <dt>{label}</dt>
          <dd>{value}</dd>
        </div>
      ))}
    </dl>
  )
}

export function Lines({ text }: { text: string[] }) {
  return <>{text.filter(Boolean).map((l, i) => <span className="line" key={i}>{l}</span>)}</>
}

/** Items table with the totals stack continuing its borders. */
export function ItemsTable({ totals, currency, gstRateBps, totalLabel }: { totals: Totals; currency: Currency; gstRateBps: number; totalLabel: string }) {
  return (
    <table className="items">
      <colgroup>
        <col className="items__detail" />
        <col className="items__num" />
        <col className="items__num" />
        <col className="items__num" />
      </colgroup>
      <thead>
        <tr><th>Detail</th><th className="r">Quantity</th><th className="r">Rate</th><th className="r">Total</th></tr>
      </thead>
      <tbody>
        {totals.lines.map((l, i) => (
          <tr key={i}>
            <td className="items__desc">
              {l.description}
              {totals.hasExempt && !l.taxable && <span className="items__exempt">Not subject to GST</span>}
            </td>
            <td className="r num">{formatQuantity(l.quantity)}</td>
            <td className="r num">{formatMoney(l.unitPrice)}</td>
            <td className="r num">{formatMoney(l.total)}</td>
          </tr>
        ))}
      </tbody>
      <tfoot>
        <tr><td colSpan={3}>Subtotal</td><td className="r num">{formatMoney(totals.subtotal)}</td></tr>
        <tr><td colSpan={3}>Goods and Services Tax ({formatRate(gstRateBps)})</td><td className="r num">{formatMoney(totals.gst)}</td></tr>
        <tr className="items__total"><td colSpan={2}>{totalLabel}</td><td colSpan={2} className="r num"><span className="items__ccy">{currency}</span> {formatMoney(totals.total)}</td></tr>
      </tfoot>
    </table>
  )
}

/** Coded fallback footer. A later phase lets uploaded artwork replace header and footer. */
export function Footer({ company }: { company: Company }) {
  return (
    <footer className="doc__foot">
      <div className="doc__foot-wm"><strong>digital dive</strong> <span>Pvt Ltd</span></div>
      <div className="doc__foot-mid"><span className="line">{company.name}</span><Lines text={company.address} /></div>
      <div className="doc__foot-end"><span className="line">{company.phone}</span><span className="line">{company.email}</span><span className="line">{company.website}</span></div>
    </footer>
  )
}
