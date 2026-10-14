'use client'
import Link from 'next/link'
import { startTransition, useActionState, useMemo, useState } from 'react'
import { saveDocAction, type FormState } from '@/app/(app)/actions'
import { computeTotals } from '@/lib/totals'
import { formatMoney, formatRate } from '@/lib/format'
import { moneyToInput, parseMoney, parseQuantity, parseRate } from '@/lib/money-input'
import { BIZ_LINES, type BizLine, type Currency, type LineItem } from '@/lib/types'

type Row = { key: number; description: string; quantity: string; unitPrice: string; taxable: boolean }
export type DocFormValues = {
  id: number | null
  clientId: number | null
  issueDate: string
  secondDate: string // due date (invoice) or valid until (quotation)
  currency: Currency
  line: BizLine
  gstRateBps: number
  notes: string
  terms: string
  items: LineItem[]
}

let nextKey = 1
const toRow = (i: LineItem): Row => ({
  key: nextKey++,
  description: i.description,
  quantity: String(i.quantity),
  unitPrice: i.unitPrice ? moneyToInput(i.unitPrice) : '',
  taxable: i.taxable,
})

export default function DocForm({
  kind, values, clients, newClientHref,
}: {
  kind: 'invoice' | 'quotation'
  values: DocFormValues
  clients: { id: number; name: string }[]
  newClientHref: string
}) {
  const [state, run, pending] = useActionState<FormState, FormData>(saveDocAction, { error: null })
  const [rows, setRows] = useState<Row[]>(() => values.items.map(toRow))
  const [currency, setCurrency] = useState<Currency>(values.currency)
  const [rate, setRate] = useState(String(values.gstRateBps / 100))

  const set = (key: number, patch: Partial<Row>) => setRows((rs) => rs.map((r) => (r.key === key ? { ...r, ...patch } : r)))
  const add = () => setRows((rs) => [...rs, toRow({ description: '', quantity: 1, unitPrice: 0, taxable: true })])
  const remove = (key: number) => setRows((rs) => (rs.length > 1 ? rs.filter((r) => r.key !== key) : rs))
  const move = (key: number, dir: -1 | 1) => setRows((rs) => {
    const i = rs.findIndex((r) => r.key === key), j = i + dir
    if (i < 0 || j < 0 || j >= rs.length) return rs
    const copy = rs.slice(); [copy[i], copy[j]] = [copy[j], copy[i]]; return copy
  })

  // Live totals with exactly the arithmetic the document will use. Rows that don't parse count as zero.
  const bps = parseRate(rate) ?? 0
  const totals = useMemo(() => computeTotals(
    rows.map((r) => ({ description: r.description, quantity: parseQuantity(r.quantity) ?? 0, unitPrice: parseMoney(r.unitPrice) ?? 0, taxable: r.taxable })),
    bps,
  ), [rows, bps])

  const itemsJson = JSON.stringify(rows.map(({ description, quantity, unitPrice, taxable }) => ({ description, quantity, unitPrice, taxable })))
  const isInvoice = kind === 'invoice'

  return (
    <form
      className="docform"
      aria-busy={pending}
      onSubmit={(e) => {
        e.preventDefault()
        const submitter = (e.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null
        if (submitter?.value === 'issue' && !window.confirm(isInvoice
          ? 'Issue this invoice? It gets the next invoice number and can’t be edited afterwards.'
          : 'Issue this quotation? It gets the next quotation number and can’t be edited afterwards.')) return
        const data = new FormData(e.currentTarget, submitter)
        startTransition(() => run(data))
      }}
    >
      <input type="hidden" name="kind" value={kind} />
      {values.id && <input type="hidden" name="id" value={values.id} />}
      <input type="hidden" name="items" value={itemsJson} />

      {state.error && <p className="form-error" role="alert">{state.error}</p>}

      <section className="panel">
        <div className="grid-form">
          <label className="field span-2">
            <span>Client</span>
            {clients.length ? (
              <select name="clientId" defaultValue={values.clientId ?? ''} required>
                <option value="" disabled>Choose a client</option>
                {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            ) : (
              <p className="muted" style={{ margin: 0 }}>No clients yet.</p>
            )}
            <small><Link href={newClientHref} className="link">Add a new client</Link></small>
          </label>
          <label className="field">
            <span>{isInvoice ? 'Invoice date' : 'Date'}</span>
            <input type="date" name="issueDate" defaultValue={values.issueDate} required />
          </label>
          <label className="field">
            <span>{isInvoice ? 'Due date' : 'Valid until'}</span>
            <input type="date" name={isInvoice ? 'dueDate' : 'validUntil'} defaultValue={values.secondDate} required />
          </label>
          <div className="field">
            <span id="line-label">Type</span>
            <div className="seg seg--field" role="radiogroup" aria-labelledby="line-label">
              {BIZ_LINES.map((l) => (
                <label key={l.value} className="seg__opt">
                  <input type="radio" name="line" value={l.value} defaultChecked={values.line === l.value} />
                  <span>{l.label}</span>
                </label>
              ))}
            </div>
            <small>For your reports only. Not printed.</small>
          </div>
          <label className="field">
            <span>Currency</span>
            <select name="currency" value={currency} onChange={(e) => setCurrency(e.target.value as Currency)}>
              <option value="MVR">MVR</option>
              <option value="USD">USD</option>
            </select>
          </label>
          <label className="field">
            <span>GST rate (%)</span>
            <input type="text" inputMode="decimal" name="gstRate" value={rate} onChange={(e) => setRate(e.target.value)} />
          </label>
        </div>
      </section>

      <section className="panel">
        <h2 className="panel__h">Line items</h2>
        <div className="items-ed" role="table" aria-label="Line items">
          <div className="items-ed__head" role="row">
            <span role="columnheader">Detail</span>
            <span role="columnheader" className="r">Qty</span>
            <span role="columnheader" className="r">Rate ({currency})</span>
            <span role="columnheader" className="r">Total</span>
            <span role="columnheader"><span className="sr">Options</span></span>
          </div>
          {rows.map((r, i) => {
            const q = parseQuantity(r.quantity), p = parseMoney(r.unitPrice)
            const line = q != null && p != null ? Math.round(q * p) : null
            return (
              <div className="items-ed__row" role="row" key={r.key}>
                <textarea
                  aria-label={`Line ${i + 1} detail`} rows={1} placeholder="What you’re charging for"
                  value={r.description} onChange={(e) => set(r.key, { description: e.target.value })}
                />
                <input
                  aria-label={`Line ${i + 1} quantity`} type="text" inputMode="decimal" className="r"
                  value={r.quantity} aria-invalid={r.quantity !== '' && q == null} onChange={(e) => set(r.key, { quantity: e.target.value })}
                />
                <input
                  aria-label={`Line ${i + 1} rate`} type="text" inputMode="decimal" className="r" placeholder="0.00"
                  value={r.unitPrice} aria-invalid={r.unitPrice !== '' && p == null} onChange={(e) => set(r.key, { unitPrice: e.target.value })}
                />
                <span className="items-ed__total r">{line == null ? '—' : formatMoney(line)}</span>
                <div className="items-ed__opts">
                  <label className="check" title="Charge GST on this line">
                    <input type="checkbox" checked={r.taxable} onChange={(e) => set(r.key, { taxable: e.target.checked })} />
                    GST
                  </label>
                  <button type="button" className="icon-btn" onClick={() => move(r.key, -1)} disabled={i === 0} aria-label={`Move line ${i + 1} up`}>↑</button>
                  <button type="button" className="icon-btn" onClick={() => move(r.key, 1)} disabled={i === rows.length - 1} aria-label={`Move line ${i + 1} down`}>↓</button>
                  <button type="button" className="icon-btn" onClick={() => remove(r.key)} disabled={rows.length === 1} aria-label={`Remove line ${i + 1}`}>✕</button>
                </div>
              </div>
            )
          })}
        </div>
        <button type="button" className="btn btn--sm" onClick={add}>Add line</button>

        <dl className="items-ed__sum">
          <div><dt>Subtotal</dt><dd>{formatMoney(totals.subtotal)}</dd></div>
          <div><dt>GST ({formatRate(bps)}{totals.hasExempt ? ', taxable lines only' : ''})</dt><dd>{formatMoney(totals.gst)}</dd></div>
          <div className="items-ed__grand"><dt>{isInvoice ? 'Total' : 'Estimated total'}</dt><dd><span className="money__ccy">{currency}</span> {formatMoney(totals.total)}</dd></div>
        </dl>
      </section>

      <section className="panel">
        <div className="grid-form">
          <label className="field span-all">
            <span>Notes</span>
            <textarea name="notes" defaultValue={values.notes} placeholder={isInvoice ? 'Optional, e.g. “Please quote the invoice number as the payment reference.”' : 'Optional'} />
            <small>Printed below the table.</small>
          </label>
          {!isInvoice && (
            <label className="field span-all">
              <span>Terms</span>
              <textarea name="terms" defaultValue={values.terms} rows={4} />
              <small>One per line. Printed as a numbered list.</small>
            </label>
          )}
        </div>
      </section>

      <div className="form-foot form-foot--sticky">
        <Link href={values.id ? `/${isInvoice ? 'invoices' : 'quotations'}/${values.id}` : `/${isInvoice ? 'invoices' : 'quotations'}`} className="btn">Cancel</Link>
        <button type="submit" name="intent" value="save" className="btn" disabled={pending}>Save draft</button>
        <button
          type="submit" name="intent" value="issue" className="btn btn--primary" disabled={pending}
        >
          Save and issue
        </button>
      </div>
    </form>
  )
}
