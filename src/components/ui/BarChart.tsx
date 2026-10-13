import type { MonthBar } from '@/lib/db/queries'
import { formatMoney } from '@/lib/format'

/** Six months of received vs expenses, one currency. Plain server-rendered SVG, no chart library. */
export default function BarChart({ months, currency }: { months: MonthBar[]; currency: string }) {
  const W = 640, H = 240, padL = 8, padR = 8, padT = 12, padB = 28
  const max = Math.max(1, ...months.flatMap((m) => [m.received, m.expenses]))
  // round the scale up to a tidy step so the guide lines read cleanly
  const step = niceStep(max / 4)
  const top = Math.ceil(max / step) * step
  const plotH = H - padT - padB
  const slot = (W - padL - padR) / months.length
  const bw = Math.min(26, slot * 0.28)
  const y = (v: number) => padT + plotH - (v / top) * plotH

  return (
    <figure className="chart">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Received and expenses in ${currency}, last six months`}>
        {[0, 1, 2, 3, 4].map((i) => {
          const v = (top / 4) * i
          return <line key={i} x1={padL} x2={W - padR} y1={y(v)} y2={y(v)} stroke="#2B2C31" strokeWidth={1} />
        })}
        {months.map((m, i) => {
          const cx = padL + slot * i + slot / 2
          return (
            <g key={m.key}>
              <rect x={cx - bw - 2} y={y(m.received)} width={bw} height={Math.max(0, padT + plotH - y(m.received))} rx="3" fill="#FF5A1F">
                <title>{`${m.label}: received ${currency} ${formatMoney(m.received)}`}</title>
              </rect>
              <rect x={cx + 2} y={y(m.expenses)} width={bw} height={Math.max(0, padT + plotH - y(m.expenses))} rx="3" fill="#5B5A57">
                <title>{`${m.label}: expenses ${currency} ${formatMoney(m.expenses)}`}</title>
              </rect>
              <text x={cx} y={H - 8} textAnchor="middle" fill="#85837D" fontSize="15">{m.label}</text>
            </g>
          )
        })}
      </svg>
      <figcaption className="chart__key">
        <span><i className="chart__sw chart__sw--in" />Received</span>
        <span><i className="chart__sw chart__sw--out" />Expenses</span>
        <span className="muted">Scale to {currency} {formatMoney(top).replace(/\.00$/, '')}</span>
      </figcaption>
    </figure>
  )
}

function niceStep(raw: number): number {
  if (raw <= 0) return 100
  const p = Math.pow(10, Math.floor(Math.log10(raw)))
  const f = raw / p
  return (f <= 1 ? 1 : f <= 2 ? 2 : f <= 5 ? 5 : 10) * p
}
