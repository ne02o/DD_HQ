import type { InvoiceData, QuotationData } from '@/lib/types'

/** A normal invoice: one taxable line, the same arithmetic as the reference (32,000 + 8% = 34,560). */
export const invoiceSample: InvoiceData = {
  number: 10,
  issueDate: '2026-10-13',
  dueDate: '2026-10-27',
  client: {
    name: 'Coral Lagoon Resort & Spa',
    address: ['Kaafu Atoll', 'Republic of Maldives'],
    tin: '1001234GST501',
  },
  currency: 'MVR',
  gstRateBps: 800,
  items: [
    { description: 'Website design and development', quantity: 1, unitPrice: 3200000, taxable: true },
  ],
  quotationRef: 7,
}

/** Stress test: 60-character name, no TIN, four-line description, seven-figure total, an exempt line. */
export const invoiceStress: InvoiceData = {
  number: 128,
  issueDate: '2026-11-01',
  dueDate: '2026-12-01',
  client: {
    name: 'Northern Atolls Hospitality & Leisure Holdings Private Limited',
    address: ['Ameenee Magu, Henveiru', 'Malé 20026', 'Republic of Maldives'],
    tin: null,
  },
  currency: 'MVR',
  gstRateBps: 800,
  items: [
    {
      description:
        'Annual brand system and campaign rollout\nLogo refresh, typography and colour system, packaging artwork for 12 SKUs,\nbilingual (English and Dhivehi) print collateral, and a 6-month social media content calendar\nIncludes three rounds of revisions per deliverable',
      quantity: 1,
      unitPrice: 98500000,
      taxable: true,
    },
    { description: 'Large-format LED screen airtime, Malé (per week)', quantity: 12, unitPrice: 1850000, taxable: true },
    { description: 'Printing pass-through at cost', quantity: 2.5, unitPrice: 412050, taxable: false },
  ],
  notes: 'Payment by bank transfer. Please quote the invoice number as the payment reference.',
}

export const quotationSample: QuotationData = {
  number: 21,
  issueDate: '2026-10-13',
  validUntil: '2026-11-12',
  client: {
    name: 'Coral Lagoon Resort & Spa',
    address: ['Kaafu Atoll', 'Republic of Maldives'],
    tin: '1001234GST501',
  },
  currency: 'USD',
  gstRateBps: 800,
  items: [
    { description: 'Brand identity refresh', quantity: 1, unitPrice: 450000, taxable: true },
    { description: 'Photography, half-day shoot on site', quantity: 2, unitPrice: 75000, taxable: true },
  ],
  terms: [
    '50% advance to begin work; balance on delivery.',
    'Prices are valid until the date above.',
    'Includes two rounds of revisions; further changes are quoted separately.',
  ],
}

/** A draft has no number yet: numbers are assigned on issue. */
export const quotationDraft: QuotationData = {
  ...quotationSample,
  number: null,
  currency: 'MVR',
  items: [{ description: 'Event branding package', quantity: 1, unitPrice: 1500000, taxable: true }],
}
