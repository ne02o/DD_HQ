# Digital Dive HQ (DD_HQ)

Read `BRIEF.md` first — it is the spec. Work one phase at a time and stop for review.

## Stack
Next.js 15 App Router, TypeScript, plain CSS for the documents (print-exact, A4), Source Sans 3 self-hosted
via @fontsource (no Google Fonts fetch at build time).

## Layout
- `src/lib/` — money, dates, numbering, totals. Pure functions, no I/O.
- `src/components/documents/` — `InvoiceDocument`, `QuotationDocument`, shared parts. Typed props only,
  no data fetching inside them.
- `src/app/preview/` — Phase 1 review page with sample and stress-test data.

## Rules
- Money is always integer minor units. Totals come from `src/lib/totals.ts`; never compute them inline.
- Never sum across currencies.
- Run `npm run typecheck` and `npm run build` before finishing.

## Production (planned)
VPS 209.74.81.212 (SSH port 22022), app at /var/www/dd-hq, PM2 process `dd-hq` on port 3010,
Nginx + Cloudflare for `hq.digitaldive.agency`.
