# Digital Dive HQ — brief

Internal tool for **Digital Dive Pvt Ltd**, a two-person design and development agency in Malé, Maldives.
It handles clients, quotations, invoices, payments and expenses, and shows the financial picture on a
dashboard. Two users only: the two partners. Keep it simple.

Deployed on the VPS at `hq.digitaldive.agency`. Built in phases; each phase stops for review.

---

## Phase 1 — documents (current)

The quotation and invoice must look exactly right before anything else is built.

**The design already exists** (our current invoice). Reproduce it faithfully; do not redesign it:

- Generous white margins. The document breathes.
- `d²` mark top right. Title centred below it in bold caps, well clear of both.
- Two-column meta block: `BILLING DETAILS` heading on the left with a label–value stack beneath it
  (Name, Address, Customer TIN Number, Invoice Date, Due Date); the document number right-aligned on the
  same baseline as the heading.
- Line-item table with a light grey header row and hairline borders on every cell:
  Detail | Quantity | Rate | Total. Detail is left-aligned, ~55% width; the three numeric columns are
  right-aligned, narrow and equal.
- Totals rows sit inside the same table, continuing its borders, with the label spanning the left columns.
- The `TOTAL` row is the only bold row and carries the currency code inline with the figure.
- Bank block below the table: Vendor TIN Number, bank name, account name, account number — same
  label–value rhythm as the billing block.
- Footer pinned to the bottom of the page in three columns: `digital dive Pvt Ltd` wordmark left, company
  name and address centre, phone / email / website right. Small, quiet, grey.
- Clean humanist sans throughout (Source Sans 3, self-hosted). Tabular figures on every number.

Fixes to the reference (template artifacts, not choices):

- No empty filler rows. Render exactly the line items that exist.
- A **Subtotal** row — MIRA requires the value excluding tax on a tax invoice.
  Totals stack: `Subtotal` → `Goods and Services Tax (8%)` → `TOTAL`.
- The GST rate in the label comes from data, never hardcoded text.

Quotation vs invoice — same house, never mistaken for each other:

- Title `QUOTATION`, number label `QUOTATION #`.
- `Invoice Date` / `Due Date` become `Date` / `Valid Until`.
- The bank block is replaced by a terms block; the totals stack is labelled as an estimate.
- A quotation is never titled `TAX INVOICE` and never carries the vendor TIN in the invoice position.

Must survive real data: a 60-character company name, a client with no TIN, a four-line item description,
a seven-figure MVR total, non-taxable items alongside taxed ones.

Dates print as `19th July 2026`, with the ordinal suffix superscript and generated from the date.

Header and footer are coded fallbacks now. A later phase adds uploadable artwork for them in Settings
(SVG preferred, PNG ≥ 300 dpi, versioned with rollback); the coded versions stay as the permanent default.
Everything between header and footer stays coded and data-driven.

## Numbering

- Format `#010`, zero-padded to three digits: `INVOICE #010`, `QUOTATION #010`. No prefix, no year.
- The sequence never resets.
- Quotations and invoices have separate counters.
- Invoices continue from **#009** — the next one issued is `#010`. Quotation start is configurable.
- A number is assigned **on issue, not on create**. Drafts are unnumbered and show `DRAFT`.
- Numbers are never reused, reordered or deleted. Cancelling keeps the number. Corrections are credit notes.
- Converting a quotation mints a fresh invoice number and prints the quotation number as a reference.
- The counter increments inside the same transaction as the insert.
- Once sent, an invoice's items, totals, dates and number are read-only.

## Money rules

- Every amount is an **integer in minor units** (laari / cents). Never floats.
- MVR and USD, set per document. Never convert, never sum across currencies; the dashboard reports each
  currency separately.
- GST rate lives in Settings (default 8%), overridable per document, applied only to taxable line items.

## Phase 2 — data layer

Prisma + SQLite. Client, Project, Quotation (`draft → sent → accepted | declined | expired`, expiry derived
from valid-until), Invoice (`draft → sent → paid | cancelled`; overdue and partially-paid are derived),
LineItem (description, quantity, unit price, taxable, sort order), Payment (many per invoice; invoice flips
to paid when covered), Expense, Settings (company details, bank block, default currency, GST rate, terms,
counters). A services catalogue (name, description, default rate, taxable) whose values are copied into
line items as a snapshot, never linked live.

## Phase 3 — app, dashboard, login

Screens to create and manage clients, quotations, invoices, payments and expenses; quotation → invoice in
one click; print to PDF from the browser. Financial dashboard per currency: invoiced, received,
outstanding, overdue, expenses, monthly trend. Login for the two partners only.
