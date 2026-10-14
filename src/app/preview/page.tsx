import InvoiceDocument from '@/components/documents/InvoiceDocument'
import QuotationDocument from '@/components/documents/QuotationDocument'
import { company } from '@/lib/company'
import { invoiceSample, invoiceStress, quotationDraft, quotationSample } from './samples'
import PrintButton from './PrintButton'
import { requireUser } from '@/lib/auth'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Document preview · Digital Dive HQ' }

export default async function PreviewPage() {
  await requireUser()
  return (
    <>
      <div className="pv-bar">
        <strong>DD HQ · Phase 1 preview</strong>
        <nav>
          <a href="#invoice">Invoice</a>
          <a href="#quotation">Quotation</a>
          <a href="#stress">Stress test</a>
          <a href="#draft">Draft</a>
        </nav>
        <PrintButton />
      </div>
      <p className="pv-note">
        Sample data only. Company phone, TIN and bank details are placeholders until Settings exists.
        Use Print / Save as PDF and check on A4 paper, not just on screen.
      </p>
      <div className="pv-stack">
        <div className="pv-label" id="invoice">Invoice</div>
        <InvoiceDocument invoice={invoiceSample} company={company} />
        <div className="pv-label" id="quotation">Quotation</div>
        <QuotationDocument quotation={quotationSample} company={company} />
        <div className="pv-label" id="stress">Stress test: long name, no TIN, 4-line item, 7-figure total, exempt line</div>
        <InvoiceDocument invoice={invoiceStress} company={company} />
        <div className="pv-label" id="draft">Draft quotation (unnumbered)</div>
        <QuotationDocument quotation={quotationDraft} company={company} />
      </div>
    </>
  )
}
