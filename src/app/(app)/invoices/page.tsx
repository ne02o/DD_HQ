import Link from 'next/link'
import { listDocuments } from '@/lib/db/queries'
import { requireUser } from '@/lib/auth'
import DocList from '@/components/ui/DocList'
import { PageHead } from '@/components/ui/bits'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Invoices · Digital Dive HQ' }

export default async function InvoicesPage() {
  await requireUser()
  const docs = listDocuments('invoice')
  return (
    <>
      <PageHead title="Invoices" sub={`${docs.length} in total`}>
        <Link href="/invoices/new" className="btn btn--primary">New invoice</Link>
      </PageHead>
      <section className="panel"><DocList kind="invoice" docs={docs} /></section>
    </>
  )
}
