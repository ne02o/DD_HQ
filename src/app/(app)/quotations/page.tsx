import { listDocuments } from '@/lib/db/queries'
import DocList from '@/components/ui/DocList'
import { PageHead } from '@/components/ui/bits'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Quotations · Digital Dive HQ' }

export default function QuotationsPage() {
  const docs = listDocuments('quotation')
  return (
    <>
      <PageHead title="Quotations" sub={`${docs.length} in total`} />
      <section className="panel"><DocList kind="quotation" docs={docs} /></section>
    </>
  )
}
