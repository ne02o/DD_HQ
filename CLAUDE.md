# Digital Dive HQ (DD_HQ)

Read `BRIEF.md` first — it is the spec. Work one phase at a time and stop for review.

## Stack
Next.js 15 App Router, TypeScript, SQLite via better-sqlite3, plain CSS for the documents and app (print-exact, A4), Source Sans 3 self-hosted
via @fontsource (no Google Fonts fetch at build time).

## Layout
- `src/lib/` — money, dates, numbering, totals. Pure functions, no I/O.
- `src/lib/db/` — SQLite (better-sqlite3). `index.ts` schema + migrations (PRAGMA user_version),
  `queries.ts` all reads/writes. Statuses like overdue / expired are derived, never stored.
- `src/app/(app)/` — the app behind the sidebar. Server components read the DB directly.
- `npm run seed` fills a local sample database (refuses in production). The real DB starts empty
  with invoices continuing at #010.
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
