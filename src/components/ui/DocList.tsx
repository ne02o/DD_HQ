import Link from 'next/link'
import type { DocSummary, Kind } from '@/lib/db/queries'
import { formatDocNumber } from '@/lib/format'
import { Empty, LineTag, Money, ShortDate, Status } from './bits'

export default function DocList({ kind, docs }: { kind: Kind; docs: DocSummary[] }) {
  const base = kind === 'invoice' ? '/invoices' : '/quotations'
  if (docs.length === 0) return <Empty>No {kind === 'invoice' ? 'invoices' : 'quotations'} yet. <Link href={`${base}/new`} className="link">Create one</Link>.</Empty>
  return (
    <div className="tablewrap">
      <table className="tbl">
        <thead>
          <tr>
            <th>{kind === 'invoice' ? 'Invoice' : 'Quote'}</th>
            <th>Client</th>
            <th>Issued</th>
            <th>{kind === 'invoice' ? 'Due' : 'Valid until'}</th>
            <th className="r">Amount</th>
            {kind === 'invoice' && <th className="r">Balance</th>}
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {docs.map((d) => (
            <tr key={d.id}>
              <td><Link href={`${base}/${d.id}`} className="rowlink">{formatDocNumber(d.number)}</Link></td>
              <td>{d.clientName} <LineTag line={d.line} /></td>
              <td><ShortDate iso={d.issueDate} /></td>
              <td><ShortDate iso={kind === 'invoice' ? d.dueDate : d.validUntil} /></td>
              <td className="r"><Money minor={d.total} currency={d.currency} /></td>
              {kind === 'invoice' && <td className="r">{d.balance > 0 && d.status !== 'draft' && d.status !== 'cancelled' ? <Money minor={d.balance} currency={d.currency} /> : <span className="muted">—</span>}</td>}
              <td><Status status={d.status} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
