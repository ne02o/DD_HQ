import { notFound } from 'next/navigation'
import InvoiceDocument from '@/components/documents/InvoiceDocument'
import DocView from '@/components/ui/DocView'
import { getCompany, getInvoice, listDocuments } from '@/lib/db/queries'
import { formatDocNumber } from '@/lib/format'

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const inv = getInvoice(Number((await params).id))
  return { title: inv ? `Invoice ${formatDocNumber(inv.number)} · Digital Dive HQ` : 'Invoice not found' }
}

export default async function InvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id)
  const invoice = Number.isInteger(id) ? getInvoice(id) : null
  if (!invoice) notFound()
  const status = listDocuments('invoice').find((d) => d.id === id)?.status ?? 'draft'
  return (
    <DocView back="/invoices" backLabel="Back to invoices" status={status}>
      <InvoiceDocument invoice={invoice} company={getCompany()} />
    </DocView>
  )
}
