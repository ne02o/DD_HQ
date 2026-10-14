/**
 * Local sample data so the dashboard has something to show. Never run against the real database.
 *   npm run seed            (refuses if documents already exist)
 *   npm run seed -- --force (wipes and reseeds)
 */
// Load .env (e.g. DATABASE_PATH on the server) the same way the app does.
try { process.loadEnvFile('.env') } catch {}
import { getDb } from '../src/lib/db/index'
import { issueDocument, todayMV } from '../src/lib/db/queries'
import { computeTotals } from '../src/lib/totals'

if (process.env.NODE_ENV === 'production') {
  console.error('Refusing to seed in production.')
  process.exit(1)
}

const db = getDb()
const force = process.argv.includes('--force')
const existing = (db.prepare('SELECT COUNT(*) AS n FROM documents').get() as { n: number }).n
if (existing && !force) {
  console.error(`Database already has ${existing} documents. Use --force to wipe and reseed.`)
  process.exit(1)
}

const today = todayMV()
const shift = (days: number) => {
  const d = new Date(today + 'T00:00:00Z')
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().slice(0, 10)
}

db.transaction(() => {
  db.exec('DELETE FROM payments; DELETE FROM line_items; DELETE FROM documents; DELETE FROM expenses; DELETE FROM clients;')
  db.prepare(`UPDATE settings SET next_invoice_no = 10, next_quotation_no = 1,
    phone = '+960 000 0000', tin = '0000000GST000',
    bank_mvr_name = 'Bank of Maldives', bank_mvr_account_name = 'Digital Dive Pvt Ltd', bank_mvr_account_number = '7700-000000-000',
    bank_usd_name = 'Bank of Maldives', bank_usd_account_name = 'Digital Dive Pvt Ltd', bank_usd_account_number = '7700-000000-001'
    WHERE id = 1`).run()
})()

const addClient = db.prepare('INSERT INTO clients (name, contact_person, email, address, tin) VALUES (?, ?, ?, ?, ?)')
const clients = [
  addClient.run('Coral Lagoon Resort & Spa', 'Front office manager', 'fo@corallagoon.example', 'Kaafu Atoll\nRepublic of Maldives', '1001234GST501').lastInsertRowid,
  addClient.run('Hulhumalé Events Council', 'Events officer', 'events@hulhumale.example', 'Hulhumalé\nRepublic of Maldives', null).lastInsertRowid,
  addClient.run('Blue Reef Dive Centre', 'Owner', 'hello@bluereef.example', 'Maafushi\nRepublic of Maldives', '1009876GST501').lastInsertRowid,
  addClient.run('Northern Atolls Hospitality Holdings Pvt Ltd', 'Marketing lead', 'marketing@nah.example', 'Malé 20026\nRepublic of Maldives', '1005555GST501').lastInsertRowid,
].map(Number)

const addDoc = db.prepare(`INSERT INTO documents (kind, client_id, issue_date, due_date, valid_until, currency, gst_rate_bps, terms)
  VALUES (?, ?, ?, ?, ?, ?, 800, ?)`)
const addItem = db.prepare('INSERT INTO line_items (document_id, sort, description, quantity, unit_price, taxable) VALUES (?, ?, ?, ?, ?, ?)')
const addPay = db.prepare('INSERT INTO payments (invoice_id, amount, date, method) VALUES (?, ?, ?, ?)')

type Item = [string, number, number, boolean?]
function invoice(client: number, issued: number, ccy: 'MVR' | 'USD', items: Item[], payDays: number[] = []) {
  const id = Number(addDoc.run('invoice', client, shift(issued), shift(issued + 14), null, ccy, '').lastInsertRowid)
  items.forEach(([d, q, p, tax = true], i) => addItem.run(id, i, d, q, p, tax ? 1 : 0))
  issueDocument(id)
  // Paid in full, or in two halves (the second takes any odd laari).
  const total = computeTotals(items.map(([description, quantity, unitPrice, taxable = true]) => ({ description, quantity, unitPrice, taxable })), 800).total
  const parts = payDays.length === 2 ? [Math.floor(total / 2), total - Math.floor(total / 2)] : payDays.length === 1 ? [total] : []
  payDays.forEach((day, i) => addPay.run(id, parts[i], shift(day), 'transfer'))
  return id
}

// Invoices oldest first so numbers run #010, #011, ... in date order.
invoice(clients[0], -170, 'MVR', [['Brand guidelines refresh', 1, 2800000]], [-150])
invoice(clients[1], -140, 'MVR', [['Independence Day carnival branding', 1, 4500000], ['Printing pass-through at cost', 1, 620000, false]], [-120])
invoice(clients[2], -115, 'USD', [['Website design and development', 1, 380000]], [-100])
invoice(clients[3], -95, 'MVR', [['Social media content, monthly retainer', 3, 1200000]], [-80])
invoice(clients[0], -70, 'MVR', [['Website design and development', 1, 3200000]], [-55])
invoice(clients[1], -50, 'MVR', [['Event livestream graphics package', 1, 1850000]], [-40, -20])
invoice(clients[2], -35, 'USD', [['Photography, half-day shoot', 2, 75000]], [-25])
invoice(clients[3], -28, 'MVR', [['LED screen campaign, Malé (per week)', 4, 1850000]])
invoice(clients[0], -9, 'MVR', [['Annual hosting and maintenance', 1, 960000]], [-2])
invoice(clients[2], -5, 'USD', [['Brand identity refresh', 1, 450000]])
// one draft (unnumbered)
const draft = Number(addDoc.run('invoice', clients[1], shift(0), shift(14), null, 'MVR', '').lastInsertRowid)
addItem.run(draft, 0, 'Event branding package', 1, 1500000, 1)

const q1 = Number(addDoc.run('quotation', clients[3], shift(-12), null, shift(18), 'MVR', '50% advance to begin work; balance on delivery.').lastInsertRowid)
addItem.run(q1, 0, 'Packaging artwork, 12 SKUs', 12, 350000, 1)
issueDocument(q1)
const q2 = Number(addDoc.run('quotation', clients[0], shift(-45), null, shift(-15), 'USD', 'Prices valid until the date above.').lastInsertRowid)
addItem.run(q2, 0, 'Drone video, resort tour', 1, 220000, 1)
issueDocument(q2)

const addExp = db.prepare('INSERT INTO expenses (date, category, description, amount, currency) VALUES (?, ?, ?, ?, ?)')
for (let k = 0; k < 6; k++) {
  addExp.run(shift(-k * 30 - 3), 'Software', 'Design and hosting subscriptions', 285000 + k * 4000, 'MVR')
  addExp.run(shift(-k * 30 - 10), 'Office', 'Co-working desk rent', 600000, 'MVR')
}
addExp.run(shift(-60), 'Equipment', 'Camera lens', 1450000, 'MVR')
addExp.run(shift(-20), 'Software', 'Font licence', 12000, 'USD')

// LED resale: tag the airtime invoices, and add the monthly fixed fee to the screen owner.
db.prepare("UPDATE documents SET line = 'led' WHERE id IN (SELECT document_id FROM line_items WHERE description LIKE 'LED%' OR description LIKE '%airtime%')").run()
invoice(clients[1], -60, 'MVR', [['LED airtime, Malé screen (2 weeks)', 2, 900000]], [-50])
invoice(clients[2], -18, 'MVR', [['LED airtime, Malé screen (4 weeks)', 4, 850000]], [-8])
db.prepare("UPDATE documents SET line = 'led' WHERE id IN (SELECT document_id FROM line_items WHERE description LIKE 'LED%')").run()
for (let k = 0; k < 6; k++) addExp.run(shift(-k * 30 - 1), 'Screen owner', 'LED airtime, fixed monthly fee', 2000000, 'MVR')
db.prepare("UPDATE expenses SET line = 'led' WHERE category = 'Screen owner'").run()

console.log('Seeded sample data:', (db.prepare('SELECT COUNT(*) AS n FROM documents').get() as { n: number }).n, 'documents')
