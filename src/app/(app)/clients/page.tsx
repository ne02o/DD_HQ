import Link from 'next/link'
import { listClients } from '@/lib/db/queries'
import { requireUser } from '@/lib/auth'
import { Empty, PageHead } from '@/components/ui/bits'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Clients · Digital Dive HQ' }

export default async function ClientsPage() {
  await requireUser()
  const clients = listClients()
  return (
    <>
      <PageHead title="Clients" sub={`${clients.length} client${clients.length === 1 ? '' : 's'}`}>
        <Link href="/clients/new" className="btn btn--primary">New client</Link>
      </PageHead>
      <section className="panel">
        {clients.length === 0 ? <Empty>No clients yet. <Link href="/clients/new" className="link">Add your first client</Link>.</Empty> : (
          <div className="tablewrap">
            <table className="tbl">
              <thead><tr><th>Name</th><th>Contact</th><th>Email</th><th>TIN</th><th className="r">Invoices</th></tr></thead>
              <tbody>
                {clients.map((c) => (
                  <tr key={c.id}>
                    <td><Link href={`/clients/${c.id}`} className="rowlink">{c.name}</Link></td>
                    <td>{c.contactPerson || <span className="muted">—</span>}</td>
                    <td>{c.email || <span className="muted">—</span>}</td>
                    <td>{c.tin || <span className="muted">None</span>}</td>
                    <td className="r">{c.invoices}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  )
}
