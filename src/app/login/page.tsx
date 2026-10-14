import { redirect } from 'next/navigation'
import { currentUser } from '@/lib/auth'
import { Mark } from '@/components/documents/parts'
import LoginForm from './LoginForm'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Sign in · Digital Dive HQ' }

export default async function LoginPage() {
  if (await currentUser()) redirect('/')
  return (
    <div className="app app--auth">
      <main className="auth">
        <div className="auth__head">
          <Mark className="auth__mark" disc="#FF5A1F" glyph="#fff" label={null} />
          <h1>Digital Dive HQ</h1>
          <p>Sign in to continue.</p>
        </div>
        <LoginForm />
      </main>
    </div>
  )
}
