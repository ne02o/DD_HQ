import { notFound, redirect } from 'next/navigation'
import { requireUser } from '@/lib/auth'
import { clientOptions, getDocRecord, newDocDefaults } from '@/lib/db/mutations'
import { PageHead } from '@/components/ui/bits'
import DocForm from './DocForm'

type Kind = 'invoice' | 'quotation'
const base = (k: Kind) => (k === 'invoice' ? '/invoices' : '/quotations')
const noun = (k: Kind) => (k === 'invoice' ? 'invoice' : 'quotation')

/** "New invoice" / "New quotation" screen. ?client=ID preselects a client (after adding one). */
export async function NewDocPage({ kind, searchParams }: { kind: Kind; searchParams: Promise<{ client?: string }> }) {
  await requireUser()
  const { client } = await searchParams
  const d = newDocDefaults(kind)
  const clients = clientOptions()
  const pre = Number(client)
  const clientId = clients.some((c) => c.id === pre) ? pre : clients.length === 1 ? clients[0].id : null
  return (
    <>
      <PageHead title={`New ${noun(kind)}`} sub="Saved as a draft until you issue it. Drafts have no number yet." />
      <DocForm
        kind={kind}
        clients={clients}
        newClientHref={`/clients/new?return=${encodeURIComponent(`${base(kind)}/new`)}`}
        values={{
          id: null, clientId, issueDate: d.issueDate, secondDate: (kind === 'invoice' ? d.dueDate : d.validUntil) ?? d.issueDate,
          currency: d.currency, line: d.line, gstRateBps: d.gstRateBps, notes: d.notes, terms: d.terms, items: d.items,
        }}
      />
    </>
  )
}

/** Edit screen. Only drafts are editable; anything issued goes back to its view. */
export async function EditDocPage({ kind, params }: { kind: Kind; params: Promise<{ id: string }> }) {
  await requireUser()
  const id = Number((await params).id)
  const d = Number.isInteger(id) ? getDocRecord(id) : null
  if (!d || d.kind !== kind) notFound()
  if (d.status !== 'draft') redirect(`${base(kind)}/${id}`)
  return (
    <>
      <PageHead title={`Edit draft ${noun(kind)}`} sub="Change anything you like. It gets its number when you issue it." />
      <DocForm
        kind={kind}
        clients={clientOptions()}
        newClientHref={`/clients/new?return=${encodeURIComponent(`${base(kind)}/${id}/edit`)}`}
        values={{
          id, clientId: d.clientId, issueDate: d.issueDate, secondDate: (kind === 'invoice' ? d.dueDate : d.validUntil) ?? d.issueDate,
          currency: d.currency, line: d.line, gstRateBps: d.gstRateBps, notes: d.notes, terms: d.terms,
          items: d.items.length ? d.items : [{ description: '', quantity: 1, unitPrice: 0, taxable: true }],
        }}
      />
    </>
  )
}
