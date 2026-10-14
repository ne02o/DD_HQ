'use client'
import { startTransition, useActionState, useEffect, useRef } from 'react'
import type { FormState } from '@/app/(app)/actions'

type Action = (prev: FormState, f: FormData) => Promise<FormState>

/**
 * A form wired to a server action, showing its error or success message.
 * `confirm` asks first (for destructive or irreversible buttons); `resetOnOk` clears the inputs after success.
 */
export default function ActForm({
  action, children, className, confirm, resetOnOk, messageAt = 'top',
}: {
  action: Action
  children: React.ReactNode
  className?: string
  confirm?: string
  resetOnOk?: boolean
  messageAt?: 'top' | 'bottom'
}) {
  const [state, run, pending] = useActionState<FormState, FormData>(action, { error: null })
  const ref = useRef<HTMLFormElement>(null)
  useEffect(() => { if (state.ok && resetOnOk) ref.current?.reset() }, [state, resetOnOk])

  const msg = state.error
    ? <p className="form-error" role="alert">{state.error}</p>
    : state.ok ? <p className="form-ok" role="status">{state.ok}</p> : null

  return (
    <form
      ref={ref}
      className={className}
      aria-busy={pending}
      onSubmit={(e) => {
        // Submit ourselves instead of via `action`, so React doesn't clear the inputs when the server says no.
        e.preventDefault()
        if (confirm && !window.confirm(confirm)) return
        const data = new FormData(e.currentTarget, (e.nativeEvent as SubmitEvent).submitter)
        startTransition(() => run(data))
      }}
    >
      {messageAt === 'top' && msg}
      <fieldset disabled={pending} className="fs">{children}</fieldset>
      {messageAt === 'bottom' && msg}
    </form>
  )
}
