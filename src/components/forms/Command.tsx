'use client'
import { docCommandAction } from '@/app/(app)/actions'
import ActForm from './ActForm'

/** A single button that runs one document command (issue, cancel, convert …). */
export default function Command({
  id, kind, cmd, label, tone, confirm,
}: {
  id: number
  kind: 'invoice' | 'quotation'
  cmd: string
  label: string
  tone?: 'primary' | 'danger'
  confirm?: string
}) {
  return (
    <ActForm action={docCommandAction} confirm={confirm} className="cmd">
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="kind" value={kind} />
      <input type="hidden" name="cmd" value={cmd} />
      <button type="submit" className={`btn${tone ? ` btn--${tone}` : ''}`}>{label}</button>
    </ActForm>
  )
}
