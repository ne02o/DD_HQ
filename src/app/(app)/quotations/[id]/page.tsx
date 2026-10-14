import Link from 'next/link'
import { notFound } from 'next/navigation'
import { requireUser } from '@/lib/auth'
import QuotationDocument from '@/components/documents/QuotationDocument'
import DocView from '@/components/ui/DocView'
import Command from '@/components/forms/Command'
import { getCompany, getQuotation, listDocuments } from '@/lib/db/queries'
import { getDb } from '@/lib/db'
import { formatDocNumber } from '@/lib/format'

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  await requireUser()
  const q = getQuotation(Number((await params).id))
  return { title: q ? `Quotation ${formatDocNumber(q.number)} · Digital Dive HQ` : 'Quotation not found' }
}

export default async function QuotationPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ notice?: string }> }) {
  await requireUser()
  const id = Number((await params).id)
  const quotation = Number.isInteger(id) ? getQuotation(id) : null
  if (!quotation) notFound()
  const { notice } = await searchParams
  const s = listDocuments('quotation').find((d) => d.id === id)!
  const invoice = getDb().prepare("SELECT id FROM documents WHERE source_quotation_id = ? AND kind = 'invoice' AND status != 'cancelled'").get(id) as { id: number } | undefined

  const actions = s.status === 'draft' ? (
    <>
      <Command id={id} kind="quotation" cmd="delete" label="Delete draft" tone="danger" confirm="Delete this draft? This can’t be undone." />
      <Link href={`/quotations/${id}/edit`} className="btn">Edit</Link>
      <Command id={id} kind="quotation" cmd="issue" label="Issue quotation" tone="primary"
        confirm="Issue this quotation? It gets the next quotation number and can’t be edited afterwards." />
    </>
  ) : (
    <>
      <Command id={id} kind="quotation" cmd="duplicate" label="Duplicate" />
      {(s.status === 'sent' || s.status === 'expired') && (
        <Command id={id} kind="quotation" cmd="decline" label="Mark declined" />
      )}
      {s.status === 'declined' && <Command id={id} kind="quotation" cmd="reopen" label="Reopen" />}
      {invoice ? (
        <Link href={`/invoices/${invoice.id}`} className="btn btn--primary">Open its invoice</Link>
      ) : s.status !== 'declined' && (
        <Command id={id} kind="quotation" cmd="convert" label="Turn into invoice" tone="primary"
          confirm="Create a draft invoice from this quotation? It will be marked accepted." />
      )}
    </>
  )

  return (
    <DocView back="/quotations" backLabel="Quotations" status={s.status} actions={actions} notice={notice ?? null}>
      <QuotationDocument quotation={quotation} company={getCompany()} />
    </DocView>
  )
}
