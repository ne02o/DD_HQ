'use client'
import { startTransition, useActionState } from 'react'
import { loginAction, type LoginState } from './actions'

export default function LoginForm() {
  const [state, action, pending] = useActionState<LoginState, FormData>(loginAction, { error: null })
  return (
    <form
      className="auth__form"
      noValidate
      onSubmit={(e) => {
        e.preventDefault() // keep the email filled in if the password was wrong
        const data = new FormData(e.currentTarget)
        startTransition(() => action(data))
      }}
    >
      <label className="field">
        <span>Email</span>
        <input name="email" type="email" autoComplete="username" required autoFocus />
      </label>
      <label className="field">
        <span>Password</span>
        <input name="password" type="password" autoComplete="current-password" required />
      </label>
      {state.error && <p className="form-error" role="alert">{state.error}</p>}
      <button type="submit" className="btn btn--primary btn--block" disabled={pending}>
        {pending ? 'Signing in…' : 'Sign in'}
      </button>
    </form>
  )
}
