'use client'
import { addPaymentAction, deletePaymentAction } from '@/app/(app)/actions'
import { formatMoney } from '@/lib/format'
import { moneyToInput } from '@/lib/money-input'
import type { Currency } from '@/lib/types'
import type { PaymentRow } from '@/lib/db/mutations'
import ActForm from './ActForm'

const METHODS: Record<string, string> = { transfer: 'Bank transfer', cash: 'Cash', cheque: 'Cheque', other: 'Other' }

function shortDate(iso: string) {
  const [y, m, d] = iso.split('-')
  return `${Number(d)} ${['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][Number(m) - 1]} ${y}`
}

export default function Payments({
  invoiceId, currency, total, paid, payments, canRecord, today,
}: {
  invoiceId: number
  currency: Currency
  total: number
  paid: number
  payments: PaymentRow[]
  canRecord: boolean
  today: string
}) {
  const balance = Math.max(0, total - paid)
  return (
    <section className="panel pay">
      <h2 className="panel__h">Payments</h2>
      <dl className="pay__sum">
        <div><dt>Total</dt><dd><span className="money__ccy">{currency}</span> {formatMoney(total)}</dd></div>
        <div><dt>Received</dt><dd><span className="money__ccy">{currency}</span> {formatMoney(paid)}</dd></div>
        <div className={balance > 0 ? 'pay__due' : 'pay__clear'}><dt>Balance</dt><dd><span className="money__ccy">{currency}</span> {formatMoney(balance)}</dd></div>
      </dl>

      {payments.length > 0 && (
        <ul className="pay__list">
          {payments.map((p) => (
            <li key={p.id}>
              <div>
                <strong>{currency} {formatMoney(p.amount)}</strong>
                <span className="muted">{shortDate(p.date)} · {METHODS[p.method] ?? p.method}{p.reference ? ` · ${p.reference}` : ''}</span>
              </div>
              <ActForm action={deletePaymentAction} confirm="Remove this payment?" className="cmd">
                <input type="hidden" name="id" value={p.id} />
                <button type="submit" className="link-btn">Remove</button>
              </ActForm>
            </li>
          ))}
        </ul>
      )}

      {canRecord && balance > 0 && (
        <ActForm action={addPaymentAction} resetOnOk className="pay__form" messageAt="bottom">
          <input type="hidden" name="invoiceId" value={invoiceId} />
          <h3>Record a payment</h3>
          <label className="field">
            <span>Amount ({currency})</span>
            <input type="text" inputMode="decimal" name="amount" defaultValue={moneyToInput(balance)} required />
          </label>
          <div className="pay__row">
            <label className="field">
              <span>Date received</span>
              <input type="date" name="date" defaultValue={today} required />
            </label>
            <label className="field">
              <span>Method</span>
              <select name="method" defaultValue="transfer">
                {Object.entries(METHODS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </label>
          </div>
          <label className="field">
            <span>Reference</span>
            <input type="text" name="reference" placeholder="Optional, e.g. bank reference" />
          </label>
          <button type="submit" className="btn btn--primary">Record payment</button>
        </ActForm>
      )}
    </section>
  )
}
