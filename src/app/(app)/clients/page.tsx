import { listClients } from '@/lib/db/queries'
import { Empty, PageHead } from '@/components/ui/bits'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Clients · Digital Dive HQ' }

export default function ClientsPage() {
  const clients = listClients()
  return (
    <>
      <PageHead title="Clients" sub={`${clients.length} client${clients.length === 1 ? '' : 's'}`} />
      <section className="panel">
        {clients.length === 0 ? <Empty>No clients yet.</Empty> : (
          <div className="tablewrap">
            <table className="tbl">
              <thead><tr><th>Name</th><th>Contact</th><th>Email</th><th>TIN</th><th className="r">Invoices</th></tr></thead>
              <tbody>
                {clients.map((c) => (
                  <tr key={c.id}>
                    <td className="strong">{c.name}</td>
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
