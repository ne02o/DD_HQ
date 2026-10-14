/**
 * Manage the people who can sign in.
 *   npm run user -- add you@digitaldive.agency "Your Name"
 *   npm run user -- password you@digitaldive.agency
 *   npm run user -- list
 *   npm run user -- remove someone@digitaldive.agency
 * Passwords are typed at a hidden prompt, never passed on the command line.
 */
import readline from 'node:readline'
// Load .env (e.g. DATABASE_PATH on the server) the same way the app does.
try { process.loadEnvFile('.env') } catch {}
import { getDb } from '../src/lib/db/index'
import { hashPassword } from '../src/lib/password'

// One reader for the whole run (a second reader would lose lines already buffered by the first).
const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: !!process.stdin.isTTY })
const lines: string[] = []
const waiting: ((s: string) => void)[] = []
rl.on('line', (l) => { const w = waiting.shift(); if (w) w(l); else lines.push(l) })
let muted = false
const out = rl as unknown as { _writeToOutput?: (s: string) => void; output: NodeJS.WriteStream }
const realWrite = out._writeToOutput?.bind(rl)
if (realWrite) out._writeToOutput = (str: string) => { if (!muted) realWrite(str) }

/** Ask for a line without echoing what's typed. */
function askHidden(question: string): Promise<string> {
  process.stdout.write(question)
  muted = true
  return new Promise((resolve) => {
    const done = (answer: string) => { muted = false; process.stdout.write('\n'); resolve(answer) }
    const ready = lines.shift()
    if (ready !== undefined) done(ready); else waiting.push(done)
  })
}

async function newPassword(): Promise<string> {
  const a = await askHidden('New password (min 10 characters): ')
  if (a.length < 10) { console.error('Too short. Use at least 10 characters.'); process.exit(1) }
  const b = await askHidden('Type it again: ')
  if (a !== b) { console.error('The two passwords don’t match.'); process.exit(1) }
  return a
}

async function main() {
  const [cmd, emailArg, ...nameParts] = process.argv.slice(2)
  const db = getDb()
  const email = emailArg?.trim().toLowerCase()

  if (cmd === 'list') {
    const rows = db.prepare('SELECT email, name, created_at FROM users ORDER BY id').all() as { email: string; name: string; created_at: string }[]
    if (!rows.length) console.log('No users yet.')
    for (const r of rows) console.log(`${r.email}  ${r.name}  (added ${r.created_at.slice(0, 10)})`)
    return
  }
  if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    console.error('Usage: npm run user -- add <email> "<name>" | password <email> | remove <email> | list')
    process.exit(1)
  }
  if (cmd === 'add') {
    const name = nameParts.join(' ').trim()
    if (!name) { console.error('Give a name too, e.g.  npm run user -- add ' + email + ' "Your Name"'); process.exit(1) }
    if (db.prepare('SELECT 1 FROM users WHERE email = ?').get(email)) { console.error('That email already has an account. Use "password" to change it.'); process.exit(1) }
    db.prepare('INSERT INTO users (email, name, password_hash) VALUES (?, ?, ?)').run(email, name, hashPassword(await newPassword()))
    console.log(`Added ${name} <${email}>. They can sign in now.`)
  } else if (cmd === 'password') {
    const user = db.prepare('SELECT id FROM users WHERE email = ?').get(email) as { id: number } | undefined
    if (!user) { console.error('No account with that email.'); process.exit(1) }
    const hash = hashPassword(await newPassword())
    db.transaction(() => {
      db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(hash, user.id)
      db.prepare('DELETE FROM sessions WHERE user_id = ?').run(user.id)
    })()
    console.log('Password changed. Any open sessions for that account were signed out.')
  } else if (cmd === 'remove') {
    const res = db.prepare('DELETE FROM users WHERE email = ?').run(email)
    console.log(res.changes ? `Removed ${email}.` : 'No account with that email.')
  } else {
    console.error('Unknown command. Use add, password, remove or list.')
    process.exit(1)
  }
}

main().finally(() => rl.close())
