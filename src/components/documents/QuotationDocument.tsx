import type { Company, QuotationData } from '@/lib/types'
import { computeTotals } from '@/lib/totals'
import { formatDocNumber } from '@/lib/format'
import { DocDate, Footer, ItemsTable, Lines, Mark, Rows } from './parts'

/**
 * One A4 quotation. Same house as the invoice, but never mistakable for it:
 * different title and number label, Date / Valid Until, an estimate total, and terms instead of bank details.
 */
export default function QuotationDocument({ quotation, company }: { quotation: QuotationData; company: Company }) {
  const totals = computeTotals(quotation.items, quotation.gstRateBps)
  const billing: [string, React.ReactNode][] = [
    ['Name', quotation.client.name],
    ['Address', <Lines key="a" text={quotation.client.address} />],
  ]
  if (quotation.client.tin) billing.push(['Customer TIN Number', quotation.client.tin])
  billing.push(['Date', <DocDate key="d" iso={quotation.issueDate} />])
  billing.push(['Valid Until', <DocDate key="v" iso={quotation.validUntil} />])

  return (
    <article className="doc doc--quotation">
      <header className="doc__head"><Mark /></header>
      <h1 className="doc__title">QUOTATION</h1>

      <section className="doc__meta">
        <div>
          <h2 className="doc__h">BILLING DETAILS</h2>
          <Rows rows={billing} />
        </div>
        <div className="doc__no">QUOTATION {formatDocNumber(quotation.number)}</div>
      </section>

      <ItemsTable totals={totals} currency={quotation.currency} gstRateBps={quotation.gstRateBps} totalLabel="ESTIMATED TOTAL" />
      <p className="doc__estimate">This is an estimate. Final amounts are confirmed on the tax invoice.</p>

      {quotation.notes && <p className="doc__notes">{quotation.notes}</p>}

      {quotation.terms.length > 0 && (
        <section className="doc__block">
          <h2 className="doc__h">TERMS</h2>
          <ol className="doc__terms">{quotation.terms.map((t, i) => <li key={i}>{t}</li>)}</ol>
        </section>
      )}

      <Footer company={company} />
    </article>
  )
}
