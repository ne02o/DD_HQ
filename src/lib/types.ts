export type Currency = 'MVR' | 'USD'

/** Which part of the business a document or expense belongs to. Never printed on documents. */
export type BizLine = 'studio' | 'led'
export const BIZ_LINES: { value: BizLine; label: string }[] = [{ value: 'studio', label: 'Studio' }, { value: 'led', label: 'LED' }]
export const isBizLine = (v: unknown): v is BizLine => v === 'studio' || v === 'led'

/** One row on a document. Money is always integer minor units (laari / cents). */
export type LineItem = {
  description: string
  quantity: number
  unitPrice: number
  taxable: boolean
}

export type Client = {
  name: string
  address: string[]
  tin?: string | null
}

export type BankAccount = {
  bankName: string
  accountName: string
  accountNumber: string
}

export type Company = {
  name: string
  address: string[]
  phone: string
  email: string
  website: string
  tin: string
  /** Separate accounts per currency; the invoice prints the one matching its currency. */
  bankAccounts: Record<Currency, BankAccount>
}

type DocumentBase = {
  /** Null while the document is a draft; numbers are assigned on issue. */
  number: number | null
  /** ISO date, YYYY-MM-DD */
  issueDate: string
  client: Client
  currency: Currency
  /** GST rate in basis points: 800 = 8%. */
  gstRateBps: number
  items: LineItem[]
  notes?: string | null
}

export type InvoiceData = DocumentBase & {
  dueDate: string
  /** Number of the quotation this invoice was converted from, if any. */
  quotationRef?: number | null
}

export type QuotationData = DocumentBase & {
  validUntil: string
  terms: string[]
}
