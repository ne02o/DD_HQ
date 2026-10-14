import Link from 'next/link'
import { notFound } from 'next/navigation'
import { requireUser } from '@/lib/auth'
import InvoiceDocument from '@/components/documents/InvoiceDocument'
import DocView from '@/components/ui/DocView'
import Command from '@/components/forms/Command'
import Payments from '@/components/forms/Payments'
import { getCompany, getInvoice, listDocuments, todayMV } from '@/lib/db/queries'
import { listPayments } from '@/lib/db/mutations'
import { formatDocNumber } from '@/lib/format'

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  await requireUser()
  const inv = getInvoice(Number((await params).id))
  return { title: inv ? `Invoice ${formatDocNumber(inv.number)} · Digital Dive HQ` : 'Invoice not found' }
}

export default async function InvoicePage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ notice?: string }> }) {
  await requireUser()
  const id = Number((await params).id)
  const invoice = Number.isInteger(id) ? getInvoice(id) : null
  if (!invoice) notFound()
  const { notice } = await searchParams
  const s = listDocuments('invoice').find((d) => d.id === id)!
  const draft = s.status === 'draft'
  const cancelled = s.status === 'cancelled'

  const actions = draft ? (
    <>
      <Command id={id} kind="invoice" cmd="delete" label="Delete draft" tone="danger" confirm="Delete this draft? This can’t be undone." />
      <Link href={`/invoices/${id}/edit`} className="btn">Edit</Link>
      <Command id={id} kind="invoice" cmd="issue" label="Issue invoice" tone="primary"
        confirm="Issue this invoice? It gets the next invoice number and can’t be edited afterwards." />
    </>
  ) : (
    <>
      <Command id={id} kind="invoice" cmd="duplicate" label="Duplicate" />
      {!cancelled && s.paid === 0 && (
        <Command id={id} kind="invoice" cmd="cancel" label="Cancel invoice" tone="danger"
          confirm={`Cancel invoice ${formatDocNumber(s.number)}? It stays on record as cancelled and its number isn’t reused.`} />
      )}
    </>
  )

  return (
    <DocView
      back="/invoices" backLabel="Invoices" status={s.status} actions={actions} notice={notice ?? null}
      aside={draft ? undefined : (
        <Payments invoiceId={id} currency={s.currency} total={s.total} paid={s.paid} payments={listPayments(id)} canRecord={!cancelled} today={todayMV()} />
      )}
    >
      <InvoiceDocument invoice={invoice} company={getCompany()} />
    </DocView>
  )
}
