'use client'
import { changePasswordAction } from '@/app/(app)/actions'
import ActForm from './ActForm'

export default function PasswordForm({ name, email }: { name: string; email: string }) {
  return (
    <ActForm action={changePasswordAction} resetOnOk className="panel" messageAt="bottom">
      <h2 className="panel__h">Your password</h2>
      <p className="panel__sub">Signed in as {name} ({email}).</p>
      <input type="text" name="username" autoComplete="username" defaultValue={email} hidden readOnly />
      <div className="grid-form">
        <label className="field">
          <span>Current password</span>
          <input type="password" name="current" autoComplete="current-password" required />
        </label>
        <label className="field">
          <span>New password</span>
          <input type="password" name="next" autoComplete="new-password" minLength={10} required />
          <small>At least 10 characters.</small>
        </label>
        <label className="field">
          <span>New password again</span>
          <input type="password" name="again" autoComplete="new-password" minLength={10} required />
        </label>
      </div>
      <div className="form-foot"><button type="submit" className="btn btn--primary">Change password</button></div>
    </ActForm>
  )
}
