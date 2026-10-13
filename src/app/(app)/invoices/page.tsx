import { listDocuments } from '@/lib/db/queries'
import DocList from '@/components/ui/DocList'
import { PageHead } from '@/components/ui/bits'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Invoices · Digital Dive HQ' }

export default function InvoicesPage() {
  const docs = listDocuments('invoice')
  return (
    <>
      <PageHead title="Invoices" sub={`${docs.length} in total`} />
      <section className="panel"><DocList kind="invoice" docs={docs} /></section>
    </>
  )
}
