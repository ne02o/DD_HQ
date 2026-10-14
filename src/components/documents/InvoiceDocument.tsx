import type { Company, InvoiceData } from '@/lib/types'
import { computeTotals } from '@/lib/totals'
import { formatDocNumber } from '@/lib/format'
import { DocDate, Footer, ItemsTable, Lines, Mark, Rows } from './parts'

/** One A4 tax invoice. Pure render: everything it shows comes from props. */
export default function InvoiceDocument({ invoice, company }: { invoice: InvoiceData; company: Company }) {
  const totals = computeTotals(invoice.items, invoice.gstRateBps)
  const bank = company.bankAccounts[invoice.currency]
  const billing: [string, React.ReactNode][] = [
    ['Name', invoice.client.name],
    ['Address', <Lines key="a" text={invoice.client.address} />],
  ]
  if (invoice.client.tin) billing.push(['Customer TIN Number', invoice.client.tin])
  billing.push(['Invoice Date', <DocDate key="d" iso={invoice.issueDate} />])
  billing.push(['Due Date', <DocDate key="u" iso={invoice.dueDate} />])
  if (invoice.quotationRef != null) billing.push(['Quotation Ref', formatDocNumber(invoice.quotationRef)])

  return (
    <article className="doc doc--invoice">
      <header className="doc__head"><Mark /></header>
      <h1 className="doc__title">TAX INVOICE</h1>

      <section className="doc__meta">
        <div>
          <h2 className="doc__h">BILLING DETAILS</h2>
          <Rows rows={billing} />
        </div>
        <div className="doc__no">INVOICE {formatDocNumber(invoice.number)}</div>
      </section>

      <ItemsTable totals={totals} currency={invoice.currency} gstRateBps={invoice.gstRateBps} totalLabel="TOTAL" />

      {invoice.notes && <p className="doc__notes">{invoice.notes}</p>}

      <section className="doc__block">
        <Rows rows={([
          ['Vendor TIN Number', company.tin],
          ['Bank', bank.bankName],
          ['Account Name', bank.accountName],
          [`Account Number (${invoice.currency})`, bank.accountNumber],
        ] as [string, string][]).filter(([, v]) => v && v.trim())} />
      </section>

      <Footer company={company} />
    </article>
  )
}
