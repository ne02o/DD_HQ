import { notFound } from 'next/navigation'
import { requireUser } from '@/lib/auth'
import { getClient } from '@/lib/db/mutations'
import { listDocuments } from '@/lib/db/queries'
import { PageHead } from '@/components/ui/bits'
import ClientForm from '@/components/forms/ClientForm'
import DocList from '@/components/ui/DocList'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Client · Digital Dive HQ' }

export default async function ClientPage({ params }: { params: Promise<{ id: string }> }) {
  await requireUser()
  const id = Number((await params).id)
  const client = Number.isInteger(id) ? getClient(id) : null
  if (!client) notFound()
  const invoices = listDocuments('invoice').filter((d) => d.clientId === id)
  const quotes = listDocuments('quotation').filter((d) => d.clientId === id)
  return (
    <>
      <PageHead title={client.name} />
      <ClientForm client={client} returnTo={null} />
      {invoices.length > 0 && <section className="panel"><h2 className="panel__h">Invoices</h2><DocList kind="invoice" docs={invoices} /></section>}
      {quotes.length > 0 && <section className="panel"><h2 className="panel__h">Quotations</h2><DocList kind="quotation" docs={quotes} /></section>}
    </>
  )
}
