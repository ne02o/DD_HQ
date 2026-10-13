import { getSettings } from '@/lib/db/queries'
import { formatDocNumber, formatRate } from '@/lib/format'
import { PageHead } from '@/components/ui/bits'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Settings · Digital Dive HQ' }

export default function SettingsPage() {
  const s = getSettings()
  const groups: [string, [string, string][]][] = [
    ['Company', [
      ['Name', s.company_name], ['Address', s.address.replace(/\n/g, ', ')], ['Phone', s.phone],
      ['Email', s.email], ['Website', s.website], ['TIN', s.tin],
    ]],
    ['Bank, MVR', [['Bank', s.bank_mvr_name], ['Account name', s.bank_mvr_account_name], ['Account number', s.bank_mvr_account_number]]],
    ['Bank, USD', [['Bank', s.bank_usd_name], ['Account name', s.bank_usd_account_name], ['Account number', s.bank_usd_account_number]]],
    ['Documents', [
      ['Default currency', s.default_currency], ['GST rate', formatRate(s.gst_rate_bps)],
      ['Payment terms', `${s.payment_terms_days} days`], ['Quotes valid for', `${s.quotation_valid_days} days`],
      ['Next invoice number', formatDocNumber(s.next_invoice_no)], ['Next quotation number', formatDocNumber(s.next_quotation_no)],
    ]],
  ]
  return (
    <>
      <PageHead title="Settings" sub="What prints on every quotation and invoice. Editing comes in the next step." />
      <div className="settings">
        {groups.map(([title, rows]) => (
          <section className="panel" key={title}>
            <h2 className="panel__h">{title}</h2>
            <dl className="kv">
              {rows.map(([k, v]) => (
                <div key={k}><dt>{k}</dt><dd>{v || <span className="muted">Not set</span>}</dd></div>
              ))}
            </dl>
          </section>
        ))}
      </div>
    </>
  )
}
