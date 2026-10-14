import { requireUser } from '@/lib/auth'
import { getSettings, listExpenses, todayMV } from '@/lib/db/queries'
import { expenseCategories } from '@/lib/db/mutations'
import { Empty, LineTag, Money, PageHead, ShortDate } from '@/components/ui/bits'
import { AddExpense, DeleteExpense } from '@/components/forms/ExpenseForms'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Expenses · Digital Dive HQ' }

export default async function ExpensesPage() {
  await requireUser()
  const rows = listExpenses()
  return (
    <>
      <PageHead title="Expenses" sub={`${rows.length} recorded`} />
      <AddExpense today={todayMV()} categories={expenseCategories()} defaultCurrency={getSettings().default_currency} />
      <section className="panel">
        {rows.length === 0 ? <Empty>No expenses recorded yet.</Empty> : (
          <div className="tablewrap">
            <table className="tbl">
              <thead><tr><th>Date</th><th>Category</th><th>Description</th><th className="r">Amount</th><th><span className="sr">Actions</span></th></tr></thead>
              <tbody>
                {rows.map((e) => (
                  <tr key={e.id}>
                    <td><ShortDate iso={e.date} /></td>
                    <td>{e.category} <LineTag line={e.line} /></td>
                    <td>{e.description}</td>
                    <td className="r"><Money minor={e.amount} currency={e.currency} /></td>
                    <td className="r"><DeleteExpense id={e.id} /></td>
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
