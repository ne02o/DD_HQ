import Link from 'next/link'
import { requireUser } from '@/lib/auth'
import { getDashboard, listDocuments } from '@/lib/db/queries'
import { isBizLine, type BizLine, type Currency } from '@/lib/types'
import { formatDocNumber, formatMoney } from '@/lib/format'
import BarChart from '@/components/ui/BarChart'
import { Empty, LineTag, Money, PageHead, SegLinks, ShortDate, Status } from '@/components/ui/bits'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Dashboard · Digital Dive HQ' }

export default async function DashboardPage({ searchParams }: { searchParams: Promise<{ ccy?: string; line?: string }> }) {
  await requireUser()
  const sp = await searchParams
  const currency: Currency = sp.ccy === 'USD' ? 'USD' : 'MVR'
  const line: BizLine | null = isBizLine(sp.line) ? sp.line : null
  const d = getDashboard(currency, line)
  const inLine = (l: BizLine) => line == null || l === line
  const attention = [
    ...listDocuments('invoice').filter((i) => i.currency === currency && inLine(i.line) && i.status === 'overdue'),
    ...listDocuments('quotation').filter((q) => q.currency === currency && inLine(q.line) && q.status === 'sent'),
  ]
  const href = (c: Currency, l: BizLine | null) => {
    const q = new URLSearchParams()
    if (c !== 'MVR') q.set('ccy', c)
    if (l) q.set('line', l)
    const qs = q.toString()
    return qs ? `/?${qs}` : '/'
  }
  const scope = line === 'led' ? 'LED' : line === 'studio' ? 'Studio' : 'All work'
  const net = d.receivedThisMonth - d.expensesThisMonth

  return (
    <>
      <PageHead title="Dashboard" sub={`${d.monthLabel} · ${scope} · ${currency}`}>
        <SegLinks label="Business line" options={[
          { label: 'All', href: href(currency, null), on: line == null },
          { label: 'Studio', href: href(currency, 'studio'), on: line === 'studio' },
          { label: 'LED', href: href(currency, 'led'), on: line === 'led' },
        ]} />
        <SegLinks label="Currency" options={(['MVR', 'USD'] as Currency[]).map((c) => ({ label: c, href: href(c, line), on: c === currency }))} />
        <Link href="/quotations/new" className="btn">New quotation</Link>
        <Link href="/invoices/new" className="btn btn--primary">New invoice</Link>
      </PageHead>

      <section className="kpis" aria-label="This month">
        <div className="kpi">
          <h2>Invoiced this month</h2>
          <Money minor={d.invoicedThisMonth} currency={currency} size="lg" />
        </div>
        <div className="kpi">
          <h2>Received this month</h2>
          <Money minor={d.receivedThisMonth} currency={currency} size="lg" />
        </div>
        <div className={`kpi${d.overdueCount ? ' kpi--alert' : ''}`}>
          <h2>Outstanding</h2>
          <Money minor={d.outstanding} currency={currency} size="lg" />
          <p>
            {d.outstandingCount === 0 ? 'Nothing unpaid' : `${d.outstandingCount} unpaid invoice${d.outstandingCount === 1 ? '' : 's'}`}
            {d.overdueCount > 0 && <span className="bad">, {d.overdueCount} overdue</span>}
          </p>
        </div>
        <div className="kpi">
          <h2>Expenses this month</h2>
          <Money minor={d.expensesThisMonth} currency={currency} size="lg" />
        </div>
      </section>

      <p className={`net ${net < 0 ? 'net--neg' : 'net--pos'}`}>
        Received minus expenses this month:{' '}
        <strong><span className="money__ccy">{currency}</span> {net < 0 ? '−' : ''}{formatMoney(Math.abs(net))}</strong>
      </p>

      <section className="grid2">
        <div className="panel">
          <h2 className="panel__h">Received vs expenses, last six months</h2>
          <BarChart months={d.months} currency={currency} />
        </div>
        <div className="panel">
          <h2 className="panel__h">Needs attention</h2>
          {attention.length === 0 ? (
            <Empty>All clear. No overdue invoices or open quotes{line ? ` for ${scope}` : ''} in {currency}.</Empty>
          ) : (
            <ul className="todo">
              {attention.map((a) => (
                <li key={`${a.kind}-${a.id}`}>
                  <Link href={`/${a.kind === 'invoice' ? 'invoices' : 'quotations'}/${a.id}`}>
                    <span className="todo__what">{a.kind === 'invoice' ? 'Invoice' : 'Quote'} {formatDocNumber(a.number)}</span>
                    <span className="todo__who">{a.clientName}</span>
                    <span className="todo__meta">
                      {a.kind === 'invoice'
                        ? <>Due <ShortDate iso={a.dueDate} /></>
                        : <>Valid until <ShortDate iso={a.validUntil} /></>}
                    </span>
                    <Money minor={a.kind === 'invoice' ? a.balance : a.total} currency={a.currency} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <section className="panel">
        <div className="panel__top">
          <h2 className="panel__h">Recent invoices</h2>
          <Link href="/invoices" className="link">All invoices</Link>
        </div>
        {d.recent.length === 0 ? (
          <Empty>No {line ? `${scope} ` : ''}{currency} invoices yet.</Empty>
        ) : (
          <div className="tablewrap">
            <table className="tbl">
              <thead>
                <tr><th>Invoice</th><th>Client</th><th>Issued</th><th>Due</th><th className="r">Amount</th><th>Status</th></tr>
              </thead>
              <tbody>
                {d.recent.map((r) => (
                  <tr key={r.id}>
                    <td><Link href={`/invoices/${r.id}`} className="rowlink">{formatDocNumber(r.number)}</Link></td>
                    <td>{r.clientName} <LineTag line={r.line} /></td>
                    <td><ShortDate iso={r.issueDate} /></td>
                    <td><ShortDate iso={r.dueDate} /></td>
                    <td className="r"><Money minor={r.total} currency={r.currency} /></td>
                    <td><Status status={r.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  )
}
