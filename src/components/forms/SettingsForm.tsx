'use client'
import { saveSettingsAction } from '@/app/(app)/actions'
import ActForm from './ActForm'

export type SettingsValues = {
  company_name: string; address: string; phone: string; email: string; website: string; tin: string
  bank_mvr_name: string; bank_mvr_account_name: string; bank_mvr_account_number: string
  bank_usd_name: string; bank_usd_account_name: string; bank_usd_account_number: string
  default_currency: string; gst_rate_bps: number; payment_terms_days: number; quotation_valid_days: number
  default_terms: string; next_invoice_no: number; next_quotation_no: number
}

function F({ name, label, value, hint, type = 'text', span }: { name: string; label: string; value: string | number; hint?: string; type?: string; span?: string }) {
  return (
    <label className={`field${span ? ` ${span}` : ''}`}>
      <span>{label}</span>
      <input type={type} name={name} defaultValue={value} inputMode={type === 'number' ? 'numeric' : undefined} />
      {hint && <small>{hint}</small>}
    </label>
  )
}

export default function SettingsForm({ s, floors }: { s: SettingsValues; floors: { invoice: number; quotation: number } }) {
  const pad = (n: number) => `#${String(n).padStart(3, '0')}`
  return (
    <ActForm action={saveSettingsAction} className="stack">
      <section className="panel">
        <h2 className="panel__h">Company</h2>
        <p className="panel__sub">Printed on every quotation and invoice.</p>
        <div className="grid-form">
          <F name="company_name" label="Company name" value={s.company_name} span="span-2" />
          <F name="tin" label="TIN" value={s.tin} hint="Printed on tax invoices as Vendor TIN." />
          <label className="field span-all">
            <span>Address</span>
            <textarea name="address" defaultValue={s.address} rows={3} />
            <small>One line per row.</small>
          </label>
          <F name="phone" label="Phone" value={s.phone} />
          <F name="email" label="Email" value={s.email} type="email" />
          <F name="website" label="Website" value={s.website} />
        </div>
      </section>

      <div className="settings">
        <section className="panel">
          <h2 className="panel__h">Bank account, MVR</h2>
          <p className="panel__sub">Shown on MVR invoices.</p>
          <div className="grid-form grid-form--1">
            <F name="bank_mvr_name" label="Bank" value={s.bank_mvr_name} />
            <F name="bank_mvr_account_name" label="Account name" value={s.bank_mvr_account_name} />
            <F name="bank_mvr_account_number" label="Account number" value={s.bank_mvr_account_number} />
          </div>
        </section>
        <section className="panel">
          <h2 className="panel__h">Bank account, USD</h2>
          <p className="panel__sub">Shown on USD invoices.</p>
          <div className="grid-form grid-form--1">
            <F name="bank_usd_name" label="Bank" value={s.bank_usd_name} />
            <F name="bank_usd_account_name" label="Account name" value={s.bank_usd_account_name} />
            <F name="bank_usd_account_number" label="Account number" value={s.bank_usd_account_number} />
          </div>
        </section>
      </div>

      <section className="panel">
        <h2 className="panel__h">New documents</h2>
        <p className="panel__sub">Defaults for new quotations and invoices. Existing documents don’t change.</p>
        <div className="grid-form">
          <label className="field">
            <span>Default currency</span>
            <select name="default_currency" defaultValue={s.default_currency}>
              <option value="MVR">MVR</option>
              <option value="USD">USD</option>
            </select>
          </label>
          <F name="gst_rate" label="GST rate (%)" value={s.gst_rate_bps / 100} />
          <F name="payment_terms_days" label="Invoices due after (days)" value={s.payment_terms_days} type="number" />
          <F name="quotation_valid_days" label="Quotes valid for (days)" value={s.quotation_valid_days} type="number" />
          <label className="field span-all">
            <span>Default quotation terms</span>
            <textarea name="default_terms" defaultValue={s.default_terms} rows={4} />
            <small>One per line.</small>
          </label>
        </div>
      </section>

      <section className="panel">
        <h2 className="panel__h">Numbering</h2>
        <p className="panel__sub">The number the next issued document gets. It can only go up, never below a number already used.</p>
        <div className="grid-form">
          <F name="next_invoice_no" label="Next invoice number" value={s.next_invoice_no} type="number" hint={`Lowest allowed: ${pad(floors.invoice)}`} />
          <F name="next_quotation_no" label="Next quotation number" value={s.next_quotation_no} type="number" hint={`Lowest allowed: ${pad(floors.quotation)}`} />
        </div>
      </section>

      <div className="form-foot"><button type="submit" className="btn btn--primary">Save settings</button></div>
    </ActForm>
  )
}
