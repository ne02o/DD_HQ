import Link from 'next/link'
import { listDocuments } from '@/lib/db/queries'
import { requireUser } from '@/lib/auth'
import DocList from '@/components/ui/DocList'
import { PageHead } from '@/components/ui/bits'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Quotations · Digital Dive HQ' }

export default async function QuotationsPage() {
  await requireUser()
  const docs = listDocuments('quotation')
  return (
    <>
      <PageHead title="Quotations" sub={`${docs.length} in total`}>
        <Link href="/quotations/new" className="btn btn--primary">New quotation</Link>
      </PageHead>
      <section className="panel"><DocList kind="quotation" docs={docs} /></section>
    </>
  )
}
