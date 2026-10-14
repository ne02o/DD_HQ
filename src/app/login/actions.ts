'use server'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { login, logout } from '@/lib/auth'

export type LoginState = { error: string | null }

export async function loginAction(_prev: LoginState, form: FormData): Promise<LoginState> {
  const email = String(form.get('email') ?? '')
  const password = String(form.get('password') ?? '')
  if (!email || !password) return { error: 'Enter your email and password.' }
  const h = await headers()
  const ip = h.get('cf-connecting-ip') || h.get('x-real-ip') || h.get('x-forwarded-for')?.split(',')[0].trim() || 'local'
  const res = await login(email, password, ip)
  if (!res.ok) return { error: res.error }
  redirect('/')
}

export async function logoutAction() {
  await logout()
  redirect('/login')
}
