'use client'
import { addExpenseAction, deleteExpenseAction } from '@/app/(app)/actions'
import { BIZ_LINES, type Currency } from '@/lib/types'
import ActForm from './ActForm'

export function AddExpense({ today, categories, defaultCurrency }: { today: string; categories: string[]; defaultCurrency: Currency }) {
  return (
    <ActForm action={addExpenseAction} resetOnOk className="panel" messageAt="bottom">
      <h2 className="panel__h">Add an expense</h2>
      <div className="grid-form expense-form">
        <label className="field">
          <span>Date</span>
          <input type="date" name="date" defaultValue={today} required />
        </label>
        <label className="field span-2">
          <span>What for</span>
          <input type="text" name="description" placeholder="e.g. Adobe subscription" required />
        </label>
        <label className="field">
          <span>Category</span>
          <input type="text" name="category" list="expense-categories" defaultValue="General" />
          <datalist id="expense-categories">{categories.map((c) => <option key={c} value={c} />)}</datalist>
        </label>
        <label className="field">
          <span>Amount</span>
          <input type="text" inputMode="decimal" name="amount" placeholder="0.00" required />
        </label>
        <div className="field">
          <span id="exp-line">Type</span>
          <div className="seg seg--field" role="radiogroup" aria-labelledby="exp-line">
            {BIZ_LINES.map((l) => (
              <label key={l.value} className="seg__opt">
                <input type="radio" name="line" value={l.value} defaultChecked={l.value === 'studio'} />
                <span>{l.label}</span>
              </label>
            ))}
          </div>
        </div>
        <label className="field">
          <span>Currency</span>
          <select name="currency" defaultValue={defaultCurrency}>
            <option value="MVR">MVR</option>
            <option value="USD">USD</option>
          </select>
        </label>
      </div>
      <div className="form-foot"><button type="submit" className="btn btn--primary">Add expense</button></div>
    </ActForm>
  )
}

export function DeleteExpense({ id }: { id: number }) {
  return (
    <ActForm action={deleteExpenseAction} confirm="Delete this expense?" className="cmd">
      <input type="hidden" name="id" value={id} />
      <button type="submit" className="link-btn">Delete</button>
    </ActForm>
  )
}
