import { getDb } from './index'
import { computeTotals } from '@/lib/totals'
import type { Company, Currency, InvoiceData, LineItem, QuotationData } from '@/lib/types'

export type Kind = 'invoice' | 'quotation'
export type InvoiceStatus = 'draft' | 'sent' | 'partly paid' | 'overdue' | 'paid' | 'cancelled'
export type QuotationStatus = 'draft' | 'sent' | 'accepted' | 'declined' | 'expired'

type SettingsRow = {
  company_name: string; address: string; phone: string; email: string; website: string; tin: string
  bank_mvr_name: string; bank_mvr_account_name: string; bank_mvr_account_number: string
  bank_usd_name: string; bank_usd_account_name: string; bank_usd_account_number: string
  default_currency: Currency; gst_rate_bps: number; payment_terms_days: number; quotation_valid_days: number
  default_terms: string; next_invoice_no: number; next_quotation_no: number
}

type DocRow = {
  id: number; kind: Kind; number: number | null; client_id: number; issue_date: string
  due_date: string | null; valid_until: string | null; currency: Currency; gst_rate_bps: number
  status: string; notes: string; terms: string; source_quotation_id: number | null
  client_name: string; client_address: string; client_tin: string | null; quotation_ref: number | null
}

const lines = (s: string) => s.split('\n').map((l) => l.trim()).filter(Boolean)

/** Today's date in the Maldives, as YYYY-MM-DD. Statuses like "overdue" are judged against this. */
export function todayMV(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Indian/Maldives', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date())
}

export function getSettings(): SettingsRow {
  return getDb().prepare('SELECT * FROM settings WHERE id = 1').get() as SettingsRow
}

export function getCompany(): Company {
  const s = getSettings()
  return {
    name: s.company_name,
    address: lines(s.address),
    phone: s.phone,
    email: s.email,
    website: s.website,
    tin: s.tin,
    bankAccounts: {
      MVR: { bankName: s.bank_mvr_name, accountName: s.bank_mvr_account_name, accountNumber: s.bank_mvr_account_number },
      USD: { bankName: s.bank_usd_name, accountName: s.bank_usd_account_name, accountNumber: s.bank_usd_account_number },
    },
  }
}

const DOC_SELECT = `
  SELECT d.*, c.name AS client_name, c.address AS client_address, c.tin AS client_tin, q.number AS quotation_ref
  FROM documents d
  JOIN clients c ON c.id = d.client_id
  LEFT JOIN documents q ON q.id = d.source_quotation_id`

function itemsFor(ids: number[]): Map<number, LineItem[]> {
  const map = new Map<number, LineItem[]>()
  if (!ids.length) return map
  const rows = getDb()
    .prepare(`SELECT document_id, description, quantity, unit_price, taxable FROM line_items WHERE document_id IN (${ids.map(() => '?').join(',')}) ORDER BY document_id, sort, id`)
    .all(...ids) as { document_id: number; description: string; quantity: number; unit_price: number; taxable: number }[]
  for (const r of rows) {
    const list = map.get(r.document_id) ?? []
    list.push({ description: r.description, quantity: r.quantity, unitPrice: r.unit_price, taxable: !!r.taxable })
    map.set(r.document_id, list)
  }
  return map
}

function paidFor(ids: number[]): Map<number, number> {
  const map = new Map<number, number>()
  if (!ids.length) return map
  const rows = getDb()
    .prepare(`SELECT invoice_id, SUM(amount) AS paid FROM payments WHERE invoice_id IN (${ids.map(() => '?').join(',')}) GROUP BY invoice_id`)
    .all(...ids) as { invoice_id: number; paid: number }[]
  for (const r of rows) map.set(r.invoice_id, r.paid)
  return map
}

export function invoiceStatus(stored: string, total: number, paid: number, due: string | null, today: string): InvoiceStatus {
  if (stored === 'draft') return 'draft'
  if (stored === 'cancelled') return 'cancelled'
  if (stored === 'paid' || (total > 0 && paid >= total)) return 'paid'
  if (due && due < today) return 'overdue'
  if (paid > 0) return 'partly paid'
  return 'sent'
}

export function quotationStatus(stored: string, validUntil: string | null, today: string): QuotationStatus {
  if (stored === 'draft' || stored === 'accepted' || stored === 'declined') return stored
  if (validUntil && validUntil < today) return 'expired'
  return 'sent'
}

export type DocSummary = {
  id: number; kind: Kind; number: number | null; clientName: string; issueDate: string
  dueDate: string | null; validUntil: string | null; currency: Currency
  total: number; paid: number; balance: number; status: InvoiceStatus | QuotationStatus
}

export function listDocuments(kind: Kind, opts: { limit?: number } = {}): DocSummary[] {
  const rows = getDb()
    .prepare(`${DOC_SELECT} WHERE d.kind = ? ORDER BY d.issue_date DESC, d.id DESC ${opts.limit ? 'LIMIT ' + Number(opts.limit) : ''}`)
    .all(kind) as DocRow[]
  const ids = rows.map((r) => r.id)
  const items = itemsFor(ids)
  const paid = kind === 'invoice' ? paidFor(ids) : new Map<number, number>()
  const today = todayMV()
  return rows.map((r) => {
    const total = computeTotals(items.get(r.id) ?? [], r.gst_rate_bps).total
    const p = paid.get(r.id) ?? 0
    return {
      id: r.id, kind: r.kind, number: r.number, clientName: r.client_name, issueDate: r.issue_date,
      dueDate: r.due_date, validUntil: r.valid_until, currency: r.currency, total, paid: p,
      balance: Math.max(0, total - p),
      status: kind === 'invoice' ? invoiceStatus(r.status, total, p, r.due_date, today) : quotationStatus(r.status, r.valid_until, today),
    }
  })
}

function getRow(kind: Kind, id: number): DocRow | undefined {
  return getDb().prepare(`${DOC_SELECT} WHERE d.kind = ? AND d.id = ?`).get(kind, id) as DocRow | undefined
}

export function getInvoice(id: number): InvoiceData | null {
  const r = getRow('invoice', id)
  if (!r) return null
  return {
    number: r.number, issueDate: r.issue_date, dueDate: r.due_date ?? r.issue_date,
    client: { name: r.client_name, address: lines(r.client_address), tin: r.client_tin },
    currency: r.currency, gstRateBps: r.gst_rate_bps, items: itemsFor([r.id]).get(r.id) ?? [],
    notes: r.notes || null, quotationRef: r.quotation_ref,
  }
}

export function getQuotation(id: number): QuotationData | null {
  const r = getRow('quotation', id)
  if (!r) return null
  return {
    number: r.number, issueDate: r.issue_date, validUntil: r.valid_until ?? r.issue_date,
    client: { name: r.client_name, address: lines(r.client_address), tin: r.client_tin },
    currency: r.currency, gstRateBps: r.gst_rate_bps, items: itemsFor([r.id]).get(r.id) ?? [],
    notes: r.notes || null, terms: lines(r.terms),
  }
}

/**
 * Issues a draft: assigns the next number and marks it sent, in one transaction, so two people
 * issuing at once can never get the same number. Numbers are never reused.
 */
export function issueDocument(id: number): number {
  const db = getDb()
  return db.transaction(() => {
    const doc = db.prepare('SELECT kind, number, status FROM documents WHERE id = ?').get(id) as { kind: Kind; number: number | null; status: string } | undefined
    if (!doc) throw new Error('Document not found')
    if (doc.number != null || doc.status !== 'draft') throw new Error('Only drafts can be issued')
    const col = doc.kind === 'invoice' ? 'next_invoice_no' : 'next_quotation_no'
    const next = (db.prepare(`SELECT ${col} AS n FROM settings WHERE id = 1`).get() as { n: number }).n
    db.prepare(`UPDATE documents SET number = ?, status = 'sent', issued_at = datetime('now') WHERE id = ?`).run(next, id)
    db.prepare(`UPDATE settings SET ${col} = ? WHERE id = 1`).run(next + 1)
    return next
  })()
}

export type ClientSummary = { id: number; name: string; contactPerson: string; email: string; phone: string; tin: string | null; invoices: number }

export function listClients(): ClientSummary[] {
  return (getDb().prepare(`
    SELECT c.id, c.name, c.contact_person AS contactPerson, c.email, c.phone, c.tin,
           (SELECT COUNT(*) FROM documents d WHERE d.client_id = c.id AND d.kind = 'invoice' AND d.status != 'draft') AS invoices
    FROM clients c ORDER BY c.name COLLATE NOCASE`).all()) as ClientSummary[]
}

export type ExpenseRow = { id: number; date: string; category: string; description: string; amount: number; currency: Currency }

export function listExpenses(): ExpenseRow[] {
  return getDb().prepare('SELECT id, date, category, description, amount, currency FROM expenses ORDER BY date DESC, id DESC').all() as ExpenseRow[]
}

// ---------------------------------------------------------------- dashboard

export type MonthBar = { key: string; label: string; received: number; expenses: number }

export type Dashboard = {
  currency: Currency
  monthLabel: string
  invoicedThisMonth: number
  receivedThisMonth: number
  expensesThisMonth: number
  outstanding: number
  outstandingCount: number
  overdue: number
  overdueCount: number
  openQuotations: number
  months: MonthBar[]
  recent: DocSummary[]
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const FULL = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

/** Every figure is for one currency only. MVR and USD are never added together. */
export function getDashboard(currency: Currency): Dashboard {
  const db = getDb()
  const today = todayMV()
  const ym = today.slice(0, 7)
  const invoices = listDocuments('invoice').filter((d) => d.currency === currency)
  const live = invoices.filter((d) => d.status !== 'draft' && d.status !== 'cancelled')

  const invoicedThisMonth = live.filter((d) => d.issueDate.startsWith(ym)).reduce((s, d) => s + d.total, 0)
  const open = live.filter((d) => d.balance > 0)
  const overdue = open.filter((d) => d.status === 'overdue')

  const sumBy = (sql: string, ...args: unknown[]) => ((db.prepare(sql).get(...args) as { s: number | null }).s ?? 0)
  const receivedFor = (prefix: string) => sumBy(
    `SELECT SUM(p.amount) AS s FROM payments p JOIN documents d ON d.id = p.invoice_id WHERE d.currency = ? AND p.date LIKE ?`, currency, `${prefix}%`)
  const expensesFor = (prefix: string) => sumBy(`SELECT SUM(amount) AS s FROM expenses WHERE currency = ? AND date LIKE ?`, currency, `${prefix}%`)

  const [y, m] = ym.split('-').map(Number)
  const months: MonthBar[] = []
  for (let k = 5; k >= 0; k--) {
    const dt = new Date(Date.UTC(y, m - 1 - k, 1))
    const key = `${dt.getUTCFullYear()}-${String(dt.getUTCMonth() + 1).padStart(2, '0')}`
    months.push({ key, label: MONTHS[dt.getUTCMonth()], received: receivedFor(key), expenses: expensesFor(key) })
  }

  const openQuotations = listDocuments('quotation').filter((q) => q.currency === currency && q.status === 'sent').length

  return {
    currency,
    monthLabel: `${FULL[m - 1]} ${y}`,
    invoicedThisMonth,
    receivedThisMonth: receivedFor(ym),
    expensesThisMonth: expensesFor(ym),
    outstanding: open.reduce((s, d) => s + d.balance, 0),
    outstandingCount: open.length,
    overdue: overdue.reduce((s, d) => s + d.balance, 0),
    overdueCount: overdue.length,
    openQuotations,
    months,
    recent: invoices.slice(0, 6),
  }
}
