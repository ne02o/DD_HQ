import { getDb } from './index'
import { getSettings, issueDocument, listDocuments, todayMV, type Kind } from './queries'
import { computeTotals } from '@/lib/totals'
import { addDays } from '@/lib/money-input'
import type { Currency, LineItem } from '@/lib/types'

/**
 * Every write goes through here. The rules from BRIEF.md are enforced at this layer, so no form or
 * future screen can bypass them: drafts are the only editable documents, numbers are assigned on issue
 * and never reused, sent invoices never change, money stays in integer minor units.
 */

export class RuleError extends Error {}

// ------------------------------------------------------------------ clients

export type ClientInput = { name: string; contactPerson: string; email: string; phone: string; address: string; tin: string; notes: string }
export type ClientRow = ClientInput & { id: number }

export function getClient(id: number): ClientRow | null {
  const r = getDb().prepare(`SELECT id, name, contact_person AS contactPerson, email, phone, address, COALESCE(tin, '') AS tin, notes FROM clients WHERE id = ?`).get(id)
  return (r as ClientRow) ?? null
}

export function saveClient(id: number | null, c: ClientInput): number {
  const db = getDb()
  const vals = [c.name.trim(), c.contactPerson.trim(), c.email.trim(), c.phone.trim(), c.address.trim(), c.tin.trim() || null, c.notes.trim()]
  if (id) {
    const res = db.prepare('UPDATE clients SET name=?, contact_person=?, email=?, phone=?, address=?, tin=?, notes=? WHERE id=?').run(...vals, id)
    if (!res.changes) throw new RuleError('Client not found.')
    return id
  }
  return Number(db.prepare('INSERT INTO clients (name, contact_person, email, phone, address, tin, notes) VALUES (?,?,?,?,?,?,?)').run(...vals).lastInsertRowid)
}

export function deleteClient(id: number) {
  const used = getDb().prepare('SELECT COUNT(*) AS n FROM documents WHERE client_id = ?').get(id) as { n: number }
  if (used.n) throw new RuleError('This client has quotations or invoices, so it can’t be deleted.')
  getDb().prepare('DELETE FROM clients WHERE id = ?').run(id)
}

export function clientOptions(): { id: number; name: string }[] {
  return getDb().prepare('SELECT id, name FROM clients ORDER BY name COLLATE NOCASE').all() as { id: number; name: string }[]
}

// ------------------------------------------------------------------ documents

export type DocInput = {
  clientId: number
  issueDate: string
  dueDate: string | null      // invoices
  validUntil: string | null   // quotations
  currency: Currency
  gstRateBps: number
  notes: string
  terms: string               // quotations, one per line
  items: LineItem[]
}

export type DocRecord = DocInput & { id: number; kind: Kind; number: number | null; status: string; sourceQuotationId: number | null }

export function getDocRecord(id: number): DocRecord | null {
  const db = getDb()
  const r = db.prepare('SELECT * FROM documents WHERE id = ?').get(id) as {
    id: number; kind: Kind; number: number | null; status: string; client_id: number; issue_date: string; due_date: string | null
    valid_until: string | null; currency: Currency; gst_rate_bps: number; notes: string; terms: string; source_quotation_id: number | null
  } | undefined
  if (!r) return null
  const items = (db.prepare('SELECT description, quantity, unit_price, taxable FROM line_items WHERE document_id = ? ORDER BY sort, id').all(id) as
    { description: string; quantity: number; unit_price: number; taxable: number }[])
    .map((i) => ({ description: i.description, quantity: i.quantity, unitPrice: i.unit_price, taxable: !!i.taxable }))
  return {
    id: r.id, kind: r.kind, number: r.number, status: r.status, clientId: r.client_id, issueDate: r.issue_date,
    dueDate: r.due_date, validUntil: r.valid_until, currency: r.currency, gstRateBps: r.gst_rate_bps,
    notes: r.notes, terms: r.terms, items, sourceQuotationId: r.source_quotation_id,
  }
}

/** Defaults for a brand-new draft, from Settings. */
export function newDocDefaults(kind: Kind): Omit<DocInput, 'clientId'> & { clientId: number | null } {
  const s = getSettings()
  const today = todayMV()
  return {
    clientId: null,
    issueDate: today,
    dueDate: kind === 'invoice' ? addDays(today, s.payment_terms_days) : null,
    validUntil: kind === 'quotation' ? addDays(today, s.quotation_valid_days) : null,
    currency: s.default_currency,
    gstRateBps: s.gst_rate_bps,
    notes: '',
    terms: kind === 'quotation' ? s.default_terms : '',
    items: [{ description: '', quantity: 1, unitPrice: 0, taxable: true }],
  }
}

function writeItems(docId: number, items: LineItem[]) {
  const db = getDb()
  db.prepare('DELETE FROM line_items WHERE document_id = ?').run(docId)
  const ins = db.prepare('INSERT INTO line_items (document_id, sort, description, quantity, unit_price, taxable) VALUES (?,?,?,?,?,?)')
  items.forEach((it, i) => ins.run(docId, i, it.description, it.quantity, it.unitPrice, it.taxable ? 1 : 0))
}

/** Create a draft (id null) or update one. Anything already issued is refused. */
export function saveDraft(kind: Kind, id: number | null, d: DocInput): number {
  const db = getDb()
  return db.transaction(() => {
    if (!db.prepare('SELECT 1 FROM clients WHERE id = ?').get(d.clientId)) throw new RuleError('Pick a client.')
    const fields = [d.clientId, d.issueDate, kind === 'invoice' ? d.dueDate : null, kind === 'quotation' ? d.validUntil : null,
      d.currency, d.gstRateBps, d.notes.trim(), kind === 'quotation' ? d.terms.trim() : '']
    let docId = id
    if (docId) {
      const cur = db.prepare('SELECT kind, status, number FROM documents WHERE id = ?').get(docId) as { kind: Kind; status: string; number: number | null } | undefined
      if (!cur || cur.kind !== kind) throw new RuleError('Document not found.')
      if (cur.status !== 'draft' || cur.number != null) throw new RuleError('Only drafts can be edited. Issued documents are locked.')
      db.prepare('UPDATE documents SET client_id=?, issue_date=?, due_date=?, valid_until=?, currency=?, gst_rate_bps=?, notes=?, terms=? WHERE id=?').run(...fields, docId)
    } else {
      docId = Number(db.prepare(`INSERT INTO documents (kind, client_id, issue_date, due_date, valid_until, currency, gst_rate_bps, notes, terms)
        VALUES (?,?,?,?,?,?,?,?,?)`).run(kind, ...fields).lastInsertRowid)
    }
    writeItems(docId, d.items)
    return docId
  })()
}

export function deleteDraft(id: number) {
  const db = getDb()
  const cur = db.prepare('SELECT status, number FROM documents WHERE id = ?').get(id) as { status: string; number: number | null } | undefined
  if (!cur) return
  if (cur.status !== 'draft' || cur.number != null) throw new RuleError('Issued documents can’t be deleted. Cancel the invoice instead; its number stays used.')
  db.transaction(() => {
    db.prepare('UPDATE documents SET source_quotation_id = NULL WHERE source_quotation_id = ?').run(id)
    db.prepare('DELETE FROM documents WHERE id = ?').run(id)
  })()
}

/** Issue a draft: checks it's complete, then assigns the next number (see issueDocument). */
export function issue(id: number): number {
  const d = getDocRecord(id)
  if (!d) throw new RuleError('Document not found.')
  if (d.status !== 'draft') throw new RuleError('This has already been issued.')
  if (!d.items.length) throw new RuleError('Add at least one line item before issuing.')
  if (computeTotals(d.items, d.gstRateBps).total <= 0) throw new RuleError('The total is zero. Check the prices before issuing.')
  if (d.kind === 'invoice' && d.dueDate && d.dueDate < d.issueDate) throw new RuleError('The due date is before the invoice date.')
  if (d.kind === 'quotation' && d.validUntil && d.validUntil < d.issueDate) throw new RuleError('“Valid until” is before the quotation date.')
  return issueDocument(id)
}

export function cancelInvoice(id: number) {
  const db = getDb()
  const cur = db.prepare("SELECT kind, status FROM documents WHERE id = ?").get(id) as { kind: Kind; status: string } | undefined
  if (!cur || cur.kind !== 'invoice') throw new RuleError('Invoice not found.')
  if (cur.status === 'draft') throw new RuleError('Drafts aren’t cancelled, just deleted.')
  if (cur.status === 'cancelled') return
  const paid = (db.prepare('SELECT COUNT(*) AS n FROM payments WHERE invoice_id = ?').get(id) as { n: number }).n
  if (paid) throw new RuleError('This invoice has payments recorded. Remove them first if it really should be cancelled.')
  db.prepare("UPDATE documents SET status = 'cancelled' WHERE id = ?").run(id)
}

export function setQuotationOutcome(id: number, outcome: 'accepted' | 'declined' | 'sent') {
  const db = getDb()
  const cur = db.prepare('SELECT kind, status FROM documents WHERE id = ?').get(id) as { kind: Kind; status: string } | undefined
  if (!cur || cur.kind !== 'quotation') throw new RuleError('Quotation not found.')
  if (cur.status === 'draft') throw new RuleError('Issue the quotation first.')
  db.prepare('UPDATE documents SET status = ? WHERE id = ?').run(outcome, id)
}

/** Copy a document into a new draft of the same kind, dated today. */
export function duplicate(id: number): number {
  const d = getDocRecord(id)
  if (!d) throw new RuleError('Document not found.')
  const fresh = newDocDefaults(d.kind)
  return saveDraft(d.kind, null, { ...d, issueDate: fresh.issueDate, dueDate: fresh.dueDate, validUntil: fresh.validUntil })
}

/** Quotation -> new draft invoice with the same items. The invoice gets its own number when issued. */
export function convertToInvoice(quotationId: number): number {
  const db = getDb()
  const q = getDocRecord(quotationId)
  if (!q || q.kind !== 'quotation') throw new RuleError('Quotation not found.')
  if (q.status === 'draft') throw new RuleError('Issue the quotation before turning it into an invoice.')
  const existing = db.prepare("SELECT id FROM documents WHERE source_quotation_id = ? AND kind = 'invoice' AND status != 'cancelled'").get(quotationId) as { id: number } | undefined
  if (existing) return existing.id
  return db.transaction(() => {
    const inv = newDocDefaults('invoice')
    const id = saveDraft('invoice', null, { ...q, issueDate: inv.issueDate, dueDate: inv.dueDate, validUntil: null, terms: '' })
    db.prepare('UPDATE documents SET source_quotation_id = ? WHERE id = ?').run(quotationId, id)
    db.prepare("UPDATE documents SET status = 'accepted' WHERE id = ?").run(quotationId)
    return id
  })()
}

// ------------------------------------------------------------------ payments

export type PaymentRow = { id: number; amount: number; date: string; method: string; reference: string; note: string }

export function listPayments(invoiceId: number): PaymentRow[] {
  return getDb().prepare('SELECT id, amount, date, method, reference, note FROM payments WHERE invoice_id = ? ORDER BY date, id').all(invoiceId) as PaymentRow[]
}

export function addPayment(invoiceId: number, p: { amount: number; date: string; method: string; reference: string; note: string }) {
  const s = listDocuments('invoice').find((d) => d.id === invoiceId)
  if (!s) throw new RuleError('Invoice not found.')
  if (s.status === 'draft') throw new RuleError('Issue the invoice before recording a payment.')
  if (s.status === 'cancelled') throw new RuleError('This invoice is cancelled.')
  if (p.amount <= 0) throw new RuleError('Enter the amount received.')
  if (p.amount > s.balance) throw new RuleError('That’s more than the balance still owed.')
  getDb().prepare('INSERT INTO payments (invoice_id, amount, date, method, reference, note) VALUES (?,?,?,?,?,?)')
    .run(invoiceId, p.amount, p.date, p.method, p.reference.trim(), p.note.trim())
}

export function deletePayment(paymentId: number): number | null {
  const db = getDb()
  const row = db.prepare('SELECT invoice_id FROM payments WHERE id = ?').get(paymentId) as { invoice_id: number } | undefined
  if (!row) return null
  db.prepare('DELETE FROM payments WHERE id = ?').run(paymentId)
  return row.invoice_id
}

// ------------------------------------------------------------------ expenses

export function addExpense(e: { date: string; category: string; description: string; amount: number; currency: Currency; note: string }) {
  if (e.amount <= 0) throw new RuleError('Enter the amount.')
  getDb().prepare('INSERT INTO expenses (date, category, description, amount, currency, note) VALUES (?,?,?,?,?,?)')
    .run(e.date, e.category.trim() || 'General', e.description.trim(), e.amount, e.currency, e.note.trim())
}

export function deleteExpense(id: number) {
  getDb().prepare('DELETE FROM expenses WHERE id = ?').run(id)
}

export function expenseCategories(): string[] {
  const used = (getDb().prepare('SELECT DISTINCT category FROM expenses ORDER BY category').all() as { category: string }[]).map((r) => r.category)
  return Array.from(new Set(['Software', 'Office', 'Equipment', 'Printing', 'Travel', 'Marketing', 'Subcontractors', 'General', ...used]))
}

// ------------------------------------------------------------------ settings

export type SettingsInput = {
  company_name: string; address: string; phone: string; email: string; website: string; tin: string
  bank_mvr_name: string; bank_mvr_account_name: string; bank_mvr_account_number: string
  bank_usd_name: string; bank_usd_account_name: string; bank_usd_account_number: string
  default_currency: Currency; gst_rate_bps: number; payment_terms_days: number; quotation_valid_days: number
  default_terms: string; next_invoice_no: number; next_quotation_no: number
}

/** The lowest each counter may be set to: one above the highest number already issued. */
export function counterFloors(): { invoice: number; quotation: number } {
  const max = (kind: Kind) => (getDb().prepare('SELECT MAX(number) AS m FROM documents WHERE kind = ?').get(kind) as { m: number | null }).m ?? 0
  return { invoice: max('invoice') + 1, quotation: max('quotation') + 1 }
}

export function updateSettings(s: SettingsInput) {
  const floors = counterFloors()
  if (s.next_invoice_no < floors.invoice) throw new RuleError(`The next invoice number can’t be below #${String(floors.invoice).padStart(3, '0')}; lower numbers are already used.`)
  if (s.next_quotation_no < floors.quotation) throw new RuleError(`The next quotation number can’t be below #${String(floors.quotation).padStart(3, '0')}; lower numbers are already used.`)
  const keys = Object.keys(s) as (keyof SettingsInput)[]
  getDb().prepare(`UPDATE settings SET ${keys.map((k) => `${k} = ?`).join(', ')} WHERE id = 1`).run(...keys.map((k) => s[k]))
}
