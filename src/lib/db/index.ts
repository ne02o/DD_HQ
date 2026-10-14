import Database from 'better-sqlite3'
import fs from 'node:fs'
import path from 'node:path'

/**
 * One SQLite file, opened once per server process. Migrations run on open, in order, and are
 * tracked with PRAGMA user_version so they never run twice.
 */
const MIGRATIONS: string[] = [
  `
  CREATE TABLE settings (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    company_name TEXT NOT NULL,
    address TEXT NOT NULL DEFAULT '',
    phone TEXT NOT NULL DEFAULT '',
    email TEXT NOT NULL DEFAULT '',
    website TEXT NOT NULL DEFAULT '',
    tin TEXT NOT NULL DEFAULT '',
    bank_mvr_name TEXT NOT NULL DEFAULT '',
    bank_mvr_account_name TEXT NOT NULL DEFAULT '',
    bank_mvr_account_number TEXT NOT NULL DEFAULT '',
    bank_usd_name TEXT NOT NULL DEFAULT '',
    bank_usd_account_name TEXT NOT NULL DEFAULT '',
    bank_usd_account_number TEXT NOT NULL DEFAULT '',
    default_currency TEXT NOT NULL DEFAULT 'MVR' CHECK (default_currency IN ('MVR','USD')),
    gst_rate_bps INTEGER NOT NULL DEFAULT 800,
    payment_terms_days INTEGER NOT NULL DEFAULT 14,
    quotation_valid_days INTEGER NOT NULL DEFAULT 30,
    default_terms TEXT NOT NULL DEFAULT '',
    next_invoice_no INTEGER NOT NULL DEFAULT 10,
    next_quotation_no INTEGER NOT NULL DEFAULT 1
  );

  CREATE TABLE clients (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    contact_person TEXT NOT NULL DEFAULT '',
    email TEXT NOT NULL DEFAULT '',
    phone TEXT NOT NULL DEFAULT '',
    address TEXT NOT NULL DEFAULT '',
    tin TEXT,
    notes TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE documents (
    id INTEGER PRIMARY KEY,
    kind TEXT NOT NULL CHECK (kind IN ('invoice','quotation')),
    number INTEGER,
    client_id INTEGER NOT NULL REFERENCES clients(id),
    issue_date TEXT NOT NULL,
    due_date TEXT,
    valid_until TEXT,
    currency TEXT NOT NULL CHECK (currency IN ('MVR','USD')),
    gst_rate_bps INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'draft',
    notes TEXT NOT NULL DEFAULT '',
    terms TEXT NOT NULL DEFAULT '',
    source_quotation_id INTEGER REFERENCES documents(id),
    issued_at TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE (kind, number)
  );

  CREATE TABLE line_items (
    id INTEGER PRIMARY KEY,
    document_id INTEGER NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    sort INTEGER NOT NULL DEFAULT 0,
    description TEXT NOT NULL,
    quantity REAL NOT NULL,
    unit_price INTEGER NOT NULL,
    taxable INTEGER NOT NULL DEFAULT 1
  );

  CREATE TABLE payments (
    id INTEGER PRIMARY KEY,
    invoice_id INTEGER NOT NULL REFERENCES documents(id),
    amount INTEGER NOT NULL CHECK (amount > 0),
    date TEXT NOT NULL,
    method TEXT NOT NULL DEFAULT 'transfer' CHECK (method IN ('transfer','cash','cheque','other')),
    reference TEXT NOT NULL DEFAULT '',
    note TEXT NOT NULL DEFAULT ''
  );

  CREATE TABLE expenses (
    id INTEGER PRIMARY KEY,
    date TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'General',
    description TEXT NOT NULL,
    amount INTEGER NOT NULL CHECK (amount > 0),
    currency TEXT NOT NULL CHECK (currency IN ('MVR','USD')),
    note TEXT NOT NULL DEFAULT ''
  );

  CREATE INDEX idx_documents_kind ON documents(kind, status);
  CREATE INDEX idx_line_items_doc ON line_items(document_id, sort);
  CREATE INDEX idx_payments_invoice ON payments(invoice_id);
  CREATE INDEX idx_expenses_date ON expenses(date);

  INSERT INTO settings (id, company_name, address, email, website, default_terms)
  VALUES (1, 'Digital Dive Pvt Ltd', 'Malé\nRepublic of Maldives', 'info@digitaldive.agency', 'digitaldive.agency',
          '50% advance to begin work; balance on delivery.\nPrices are valid until the date above.');
  `,
  // 2: login for the two partners
  `
  CREATE TABLE users (
    id INTEGER PRIMARY KEY,
    email TEXT NOT NULL UNIQUE COLLATE NOCASE,
    name TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE sessions (
    token_hash TEXT PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires_at TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
  CREATE INDEX idx_sessions_user ON sessions(user_id);
  `,
]

let instance: Database.Database | null = null

export function dbPath(): string {
  return process.env.DATABASE_PATH || path.join(process.cwd(), 'data', 'hq.db')
}

export function getDb(): Database.Database {
  if (instance) return instance
  const file = dbPath()
  fs.mkdirSync(path.dirname(file), { recursive: true })
  const db = new Database(file)
  db.pragma('journal_mode = WAL')
  db.pragma('foreign_keys = ON')
  migrate(db)
  instance = db
  return db
}

function migrate(db: Database.Database) {
  const current = db.pragma('user_version', { simple: true }) as number
  for (let v = current; v < MIGRATIONS.length; v++) {
    db.transaction(() => {
      db.exec(MIGRATIONS[v])
      db.pragma(`user_version = ${v + 1}`)
    })()
  }
}
