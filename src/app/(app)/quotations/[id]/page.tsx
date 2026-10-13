import { notFound } from 'next/navigation'
import QuotationDocument from '@/components/documents/QuotationDocument'
import DocView from '@/components/ui/DocView'
import { getCompany, getQuotation, listDocuments } from '@/lib/db/queries'
import { formatDocNumber } from '@/lib/format'

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const q = getQuotation(Number((await params).id))
  return { title: q ? `Quotation ${formatDocNumber(q.number)} · Digital Dive HQ` : 'Quotation not found' }
}

export default async function QuotationPage({ params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id)
  const quotation = Number.isInteger(id) ? getQuotation(id) : null
  if (!quotation) notFound()
  const status = listDocuments('quotation').find((d) => d.id === id)?.status ?? 'draft'
  return (
    <DocView back="/quotations" backLabel="Back to quotations" status={status}>
      <QuotationDocument quotation={quotation} company={getCompany()} />
    </DocView>
  )
}
