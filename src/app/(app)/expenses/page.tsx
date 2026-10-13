import { listExpenses } from '@/lib/db/queries'
import { Empty, Money, PageHead, ShortDate } from '@/components/ui/bits'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Expenses · Digital Dive HQ' }

export default function ExpensesPage() {
  const rows = listExpenses()
  return (
    <>
      <PageHead title="Expenses" sub={`${rows.length} recorded`} />
      <section className="panel">
        {rows.length === 0 ? <Empty>No expenses recorded yet.</Empty> : (
          <div className="tablewrap">
            <table className="tbl">
              <thead><tr><th>Date</th><th>Category</th><th>Description</th><th className="r">Amount</th></tr></thead>
              <tbody>
                {rows.map((e) => (
                  <tr key={e.id}>
                    <td><ShortDate iso={e.date} /></td>
                    <td>{e.category}</td>
                    <td>{e.description}</td>
                    <td className="r"><Money minor={e.amount} currency={e.currency} /></td>
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
