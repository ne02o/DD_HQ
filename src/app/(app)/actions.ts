'use server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { requireUser } from '@/lib/auth'
import {
  RuleError, addExpense, addPayment, cancelInvoice, convertToInvoice, deleteClient, deleteDraft, deleteExpense,
  deletePayment, duplicate, issue, saveClient, saveDraft, setQuotationOutcome, updateSettings, type DocInput,
} from '@/lib/db/mutations'
import { isIsoDate, parseMoney, parseQuantity, parseRate } from '@/lib/money-input'
import type { Currency, LineItem } from '@/lib/types'
import type { Kind } from '@/lib/db/queries'

export type FormState = { error: string | null; ok?: string | null }

const str = (f: FormData, k: string, max = 2000) => String(f.get(k) ?? '').slice(0, max)
const id = (f: FormData, k = 'id') => { const n = Number(f.get(k)); return Number.isInteger(n) && n > 0 ? n : null }
const currency = (v: string): Currency | null => (v === 'MVR' || v === 'USD' ? v : null)
const path = (kind: Kind) => (kind === 'invoice' ? '/invoices' : '/quotations')

/** Runs a write, turning rule violations into a message for the form instead of a crash. */
async function run(fn: () => void | Promise<void>): Promise<FormState> {
  try {
    await fn()
    return { error: null }
  } catch (e) {
    if (e instanceof RuleError) return { error: e.message }
    if (e && typeof e === 'object' && 'digest' in e && String((e as { digest: unknown }).digest).startsWith('NEXT_REDIRECT')) throw e
    console.error(e)
    return { error: 'Something went wrong while saving. Nothing was changed.' }
  }
}

function refreshAll() {
  revalidatePath('/', 'layout')
}

// ------------------------------------------------------------------ clients

export async function saveClientAction(_p: FormState, f: FormData): Promise<FormState> {
  await requireUser()
  const name = str(f, 'name', 200).trim()
  if (!name) return { error: 'Enter the client’s name.' }
  const email = str(f, 'email', 200).trim()
  if (email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return { error: 'That email address doesn’t look right.' }
  let newId = 0
  const res = await run(() => {
    newId = saveClient(id(f), {
      name, email, contactPerson: str(f, 'contactPerson', 200), phone: str(f, 'phone', 60),
      address: str(f, 'address', 500), tin: str(f, 'tin', 40), notes: str(f, 'notes', 2000),
    })
  })
  if (res.error) return res
  refreshAll()
  const back = str(f, 'return', 200)
  redirect(back.startsWith('/') && !back.startsWith('//') ? `${back}${back.includes('?') ? '&' : '?'}client=${newId}` : '/clients')
}

export async function deleteClientAction(_p: FormState, f: FormData): Promise<FormState> {
  await requireUser()
  const cid = id(f)
  if (!cid) return { error: 'Client not found.' }
  const res = await run(() => deleteClient(cid))
  if (res.error) return res
  refreshAll()
  redirect('/clients')
}

// ------------------------------------------------------------------ documents

type RawItem = { description?: unknown; quantity?: unknown; unitPrice?: unknown; taxable?: unknown }

function parseDoc(kind: Kind, f: FormData): { data?: DocInput; error?: string } {
  const clientId = id(f, 'clientId')
  if (!clientId) return { error: 'Pick a client.' }
  const issueDate = str(f, 'issueDate', 10)
  if (!isIsoDate(issueDate)) return { error: kind === 'invoice' ? 'Enter the invoice date.' : 'Enter the quotation date.' }
  const second = str(f, kind === 'invoice' ? 'dueDate' : 'validUntil', 10)
  if (!isIsoDate(second)) return { error: kind === 'invoice' ? 'Enter the due date.' : 'Enter the “valid until” date.' }
  if (second < issueDate) return { error: kind === 'invoice' ? 'The due date is before the invoice date.' : '“Valid until” is before the quotation date.' }
  const ccy = currency(str(f, 'currency', 3))
  if (!ccy) return { error: 'Pick MVR or USD.' }
  const rate = parseRate(str(f, 'gstRate', 6))
  if (rate == null) return { error: 'The GST rate should be a number like 8.' }

  let raw: RawItem[]
  try { raw = JSON.parse(str(f, 'items', 200_000)) } catch { return { error: 'The line items couldn’t be read. Reload the page and try again.' } }
  if (!Array.isArray(raw) || raw.length > 200) return { error: 'The line items couldn’t be read.' }
  const items: LineItem[] = []
  for (let i = 0; i < raw.length; i++) {
    const r = raw[i]
    const description = String(r.description ?? '').trim().slice(0, 2000)
    const qtyText = String(r.quantity ?? '').trim()
    const priceText = String(r.unitPrice ?? '').trim()
    if (!description && !qtyText && !priceText) continue // ignore fully empty rows
    if (!description) return { error: `Line ${i + 1}: add a description.` }
    const quantity = parseQuantity(qtyText)
    if (quantity == null) return { error: `Line ${i + 1}: quantity should be a number above 0, like 1 or 2.5.` }
    const unitPrice = parseMoney(priceText)
    if (unitPrice == null) return { error: `Line ${i + 1}: rate should be an amount like 1500 or 1,500.00.` }
    items.push({ description, quantity, unitPrice, taxable: r.taxable !== false })
  }
  if (!items.length) return { error: 'Add at least one line item.' }

  return {
    data: {
      clientId, issueDate, currency: ccy, gstRateBps: rate, items,
      dueDate: kind === 'invoice' ? second : null,
      validUntil: kind === 'quotation' ? second : null,
      notes: str(f, 'notes', 4000),
      terms: kind === 'quotation' ? str(f, 'terms', 4000) : '',
    },
  }
}

export async function saveDocAction(_p: FormState, f: FormData): Promise<FormState> {
  await requireUser()
  const kind: Kind = f.get('kind') === 'quotation' ? 'quotation' : 'invoice'
  const parsed = parseDoc(kind, f)
  if (!parsed.data) return { error: parsed.error ?? 'Check the form.' }
  const intent = str(f, 'intent', 10)
  let docId = 0
  const res = await run(() => {
    docId = saveDraft(kind, id(f), parsed.data!)
    if (intent === 'issue') issue(docId)
  })
  if (res.error) {
    // Saved as a draft but issuing was refused: show the draft with the reason.
    if (docId) { refreshAll(); redirect(`${path(kind)}/${docId}?notice=${encodeURIComponent(res.error)}`) }
    return res
  }
  refreshAll()
  redirect(`${path(kind)}/${docId}`)
}

/** One action for every button on a document page. */
export async function docCommandAction(_p: FormState, f: FormData): Promise<FormState> {
  await requireUser()
  const docId = id(f)
  const kind: Kind = f.get('kind') === 'quotation' ? 'quotation' : 'invoice'
  if (!docId) return { error: 'Document not found.' }
  const cmd = str(f, 'cmd', 20)
  let goTo: string | null = null
  const res = await run(() => {
    switch (cmd) {
      case 'issue': issue(docId); break
      case 'delete': deleteDraft(docId); goTo = path(kind); break
      case 'cancel': cancelInvoice(docId); break
      case 'accept': setQuotationOutcome(docId, 'accepted'); break
      case 'decline': setQuotationOutcome(docId, 'declined'); break
      case 'reopen': setQuotationOutcome(docId, 'sent'); break
      case 'duplicate': goTo = `${path(kind)}/${duplicate(docId)}/edit`; break
      case 'convert': goTo = `/invoices/${convertToInvoice(docId)}`; break
      default: throw new RuleError('Unknown action.')
    }
  })
  if (res.error) return res
  refreshAll()
  if (goTo) redirect(goTo)
  return { error: null }
}

// ------------------------------------------------------------------ payments

export async function addPaymentAction(_p: FormState, f: FormData): Promise<FormState> {
  await requireUser()
  const invoiceId = id(f, 'invoiceId')
  if (!invoiceId) return { error: 'Invoice not found.' }
  const amount = parseMoney(str(f, 'amount', 30))
  if (amount == null || amount <= 0) return { error: 'Enter the amount received, like 1500 or 1,500.00.' }
  const date = str(f, 'date', 10)
  if (!isIsoDate(date)) return { error: 'Enter the date it was received.' }
  const method = str(f, 'method', 10)
  if (!['transfer', 'cash', 'cheque', 'other'].includes(method)) return { error: 'Pick how it was paid.' }
  const res = await run(() => addPayment(invoiceId, { amount, date, method, reference: str(f, 'reference', 200), note: '' }))
  if (res.error) return res
  refreshAll()
  return { error: null, ok: 'Payment recorded.' }
}

export async function deletePaymentAction(_p: FormState, f: FormData): Promise<FormState> {
  await requireUser()
  const pid = id(f)
  if (!pid) return { error: 'Payment not found.' }
  const res = await run(() => { deletePayment(pid) })
  if (res.error) return res
  refreshAll()
  return { error: null }
}

// ------------------------------------------------------------------ expenses

export async function addExpenseAction(_p: FormState, f: FormData): Promise<FormState> {
  await requireUser()
  const description = str(f, 'description', 300).trim()
  if (!description) return { error: 'Say what the expense was for.' }
  const amount = parseMoney(str(f, 'amount', 30))
  if (amount == null || amount <= 0) return { error: 'Enter the amount, like 1500 or 1,500.00.' }
  const date = str(f, 'date', 10)
  if (!isIsoDate(date)) return { error: 'Enter the date.' }
  const ccy = currency(str(f, 'currency', 3))
  if (!ccy) return { error: 'Pick MVR or USD.' }
  const res = await run(() => addExpense({ date, category: str(f, 'category', 60), description, amount, currency: ccy, note: '' }))
  if (res.error) return res
  refreshAll()
  return { error: null, ok: 'Expense added.' }
}

export async function deleteExpenseAction(_p: FormState, f: FormData): Promise<FormState> {
  await requireUser()
  const eid = id(f)
  if (!eid) return { error: 'Expense not found.' }
  const res = await run(() => deleteExpense(eid))
  if (res.error) return res
  refreshAll()
  return { error: null }
}

// ------------------------------------------------------------------ settings

export async function saveSettingsAction(_p: FormState, f: FormData): Promise<FormState> {
  await requireUser()
  const company_name = str(f, 'company_name', 200).trim()
  if (!company_name) return { error: 'Enter the company name.' }
  const ccy = currency(str(f, 'default_currency', 3))
  if (!ccy) return { error: 'Pick a default currency.' }
  const rate = parseRate(str(f, 'gst_rate', 6))
  if (rate == null) return { error: 'The GST rate should be a number like 8.' }
  const int = (k: string, min: number, max: number) => {
    const n = Number(str(f, k, 12))
    return Number.isInteger(n) && n >= min && n <= max ? n : null
  }
  const terms = int('payment_terms_days', 0, 365)
  const valid = int('quotation_valid_days', 1, 365)
  const nextInv = int('next_invoice_no', 1, 999_999)
  const nextQuo = int('next_quotation_no', 1, 999_999)
  if (terms == null) return { error: 'Payment terms should be a number of days between 0 and 365.' }
  if (valid == null) return { error: 'Quote validity should be a number of days between 1 and 365.' }
  if (nextInv == null || nextQuo == null) return { error: 'Next numbers should be whole numbers, like 10.' }
  const t = (k: string, max = 200) => str(f, k, max).trim()
  const res = await run(() => updateSettings({
    company_name, address: t('address', 500), phone: t('phone', 60), email: t('email'), website: t('website'), tin: t('tin', 40),
    bank_mvr_name: t('bank_mvr_name'), bank_mvr_account_name: t('bank_mvr_account_name'), bank_mvr_account_number: t('bank_mvr_account_number', 60),
    bank_usd_name: t('bank_usd_name'), bank_usd_account_name: t('bank_usd_account_name'), bank_usd_account_number: t('bank_usd_account_number', 60),
    default_currency: ccy, gst_rate_bps: rate, payment_terms_days: terms, quotation_valid_days: valid,
    default_terms: t('default_terms', 4000), next_invoice_no: nextInv, next_quotation_no: nextQuo,
  }))
  if (res.error) return res
  refreshAll()
  return { error: null, ok: 'Settings saved. New documents will use them.' }
}
