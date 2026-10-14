import 'server-only'
import crypto from 'node:crypto'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { getDb } from './db'
import { hashPassword, verifyPassword } from './password'

/**
 * Login for the two partners. Passwords are hashed with scrypt; sessions are random tokens kept in
 * an httpOnly cookie, and only their SHA-256 hash is stored, so a copied database can't sign anyone in.
 */
const COOKIE = 'dd_hq_session'
const SESSION_DAYS = 30

export type User = { id: number; email: string; name: string }

const sha256 = (s: string) => crypto.createHash('sha256').update(s).digest('hex')

// A dummy hash so a wrong email takes as long as a wrong password.
const DUMMY_HASH = hashPassword(crypto.randomBytes(12).toString('hex'))

// Simple brute-force brake: after 8 failures for an email (or IP) within 15 minutes, refuse for a while.
const failures = new Map<string, { count: number; first: number }>()
const WINDOW_MS = 15 * 60 * 1000
const MAX_FAILS = 8

function tooManyAttempts(key: string): boolean {
  const f = failures.get(key)
  if (!f) return false
  if (Date.now() - f.first > WINDOW_MS) { failures.delete(key); return false }
  return f.count >= MAX_FAILS
}
function noteFailure(key: string) {
  const f = failures.get(key)
  if (!f || Date.now() - f.first > WINDOW_MS) failures.set(key, { count: 1, first: Date.now() })
  else f.count++
}

export type LoginResult = { ok: true } | { ok: false; error: string }

export async function login(email: string, password: string, ip: string): Promise<LoginResult> {
  const e = email.trim().toLowerCase()
  const keys = [`e:${e}`, `ip:${ip}`]
  if (keys.some(tooManyAttempts)) return { ok: false, error: 'Too many attempts. Wait 15 minutes, then try again.' }

  const row = getDb().prepare('SELECT id, password_hash FROM users WHERE email = ?').get(e) as { id: number; password_hash: string } | undefined
  const valid = verifyPassword(password, row?.password_hash ?? DUMMY_HASH) && !!row
  if (!valid || !row) {
    keys.forEach(noteFailure)
    return { ok: false, error: 'That email and password don’t match.' }
  }
  keys.forEach((k) => failures.delete(k))

  const token = crypto.randomBytes(32).toString('base64url')
  const expires = new Date(Date.now() + SESSION_DAYS * 86400_000)
  const db = getDb()
  db.prepare("DELETE FROM sessions WHERE expires_at < datetime('now')").run()
  db.prepare('INSERT INTO sessions (token_hash, user_id, expires_at) VALUES (?, ?, ?)')
    .run(sha256(token), row.id, expires.toISOString().replace('T', ' ').slice(0, 19))

  const jar = await cookies()
  jar.set(COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    expires,
  })
  return { ok: true }
}

export async function logout() {
  const jar = await cookies()
  const token = jar.get(COOKIE)?.value
  if (token) getDb().prepare('DELETE FROM sessions WHERE token_hash = ?').run(sha256(token))
  jar.delete(COOKIE)
}

export async function currentUser(): Promise<User | null> {
  const token = (await cookies()).get(COOKIE)?.value
  if (!token) return null
  const row = getDb().prepare(`
    SELECT u.id, u.email, u.name FROM sessions s JOIN users u ON u.id = s.user_id
    WHERE s.token_hash = ? AND s.expires_at > datetime('now')`).get(sha256(token)) as User | undefined
  return row ?? null
}

/** Use at the top of every page and every server action. */
export async function requireUser(): Promise<User> {
  const user = await currentUser()
  if (!user) redirect('/login')
  return user
}

/**
 * Change the signed-in user's password. Checks the current one first, then signs out every other
 * session for this account (this browser stays signed in).
 */
export async function changePassword(userId: number, current: string, next: string): Promise<LoginResult> {
  if (next.length < 10) return { ok: false, error: 'Use at least 10 characters for the new password.' }
  const db = getDb()
  const row = db.prepare('SELECT password_hash FROM users WHERE id = ?').get(userId) as { password_hash: string } | undefined
  if (!row || !verifyPassword(current, row.password_hash)) return { ok: false, error: 'Your current password isn’t right.' }
  if (verifyPassword(next, row.password_hash)) return { ok: false, error: 'That’s the same as your current password.' }
  const token = (await cookies()).get(COOKIE)?.value ?? ''
  db.transaction(() => {
    db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(hashPassword(next), userId)
    db.prepare('DELETE FROM sessions WHERE user_id = ? AND token_hash != ?').run(userId, sha256(token))
  })()
  return { ok: true }
}
