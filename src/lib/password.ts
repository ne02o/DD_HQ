import crypto from 'node:crypto'

// scrypt with a per-password random salt. Stored as "scrypt$<salt>$<key>".
const PARAMS = { N: 16384, r: 8, p: 1 } as const

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16)
  const key = crypto.scryptSync(password, salt, 64, PARAMS)
  return `scrypt$${salt.toString('base64')}$${key.toString('base64')}`
}

export function verifyPassword(password: string, stored: string): boolean {
  const [scheme, saltB64, keyB64] = stored.split('$')
  if (scheme !== 'scrypt' || !saltB64 || !keyB64) return false
  const expected = Buffer.from(keyB64, 'base64')
  const actual = crypto.scryptSync(password, Buffer.from(saltB64, 'base64'), expected.length, PARAMS)
  return crypto.timingSafeEqual(actual, expected)
}
