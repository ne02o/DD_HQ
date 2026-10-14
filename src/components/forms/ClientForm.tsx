'use client'
import Link from 'next/link'
import { deleteClientAction, saveClientAction } from '@/app/(app)/actions'
import type { ClientRow } from '@/lib/db/mutations'
import ActForm from './ActForm'

export default function ClientForm({ client, returnTo }: { client: ClientRow | null; returnTo: string | null }) {
  const c = client
  return (
    <>
      <ActForm action={saveClientAction} className="stack">
        {c && <input type="hidden" name="id" value={c.id} />}
        {returnTo && <input type="hidden" name="return" value={returnTo} />}
        <section className="panel">
          <div className="grid-form">
            <label className="field span-2">
              <span>Name</span>
              <input type="text" name="name" defaultValue={c?.name} required autoFocus={!c} />
              <small>As it should appear on invoices.</small>
            </label>
            <label className="field">
              <span>Customer TIN</span>
              <input type="text" name="tin" defaultValue={c?.tin} placeholder="Optional" />
              <small>Printed on tax invoices when set.</small>
            </label>
            <label className="field span-all">
              <span>Address</span>
              <textarea name="address" defaultValue={c?.address} rows={3} placeholder={'One line per row, e.g.\nKaafu Atoll\nRepublic of Maldives'} />
            </label>
            <label className="field">
              <span>Contact person</span>
              <input type="text" name="contactPerson" defaultValue={c?.contactPerson} />
            </label>
            <label className="field">
              <span>Email</span>
              <input type="email" name="email" defaultValue={c?.email} />
            </label>
            <label className="field">
              <span>Phone</span>
              <input type="text" name="phone" defaultValue={c?.phone} />
            </label>
            <label className="field span-all">
              <span>Notes</span>
              <textarea name="notes" defaultValue={c?.notes} placeholder="Only you two see this." />
            </label>
          </div>
        </section>
        <div className="form-foot">
          <Link href={returnTo ?? '/clients'} className="btn">Cancel</Link>
          <button type="submit" className="btn btn--primary">{c ? 'Save changes' : 'Add client'}</button>
        </div>
      </ActForm>

      {c && (
        <ActForm action={deleteClientAction} confirm={`Delete ${c.name}? This can’t be undone.`} className="danger-zone">
          <input type="hidden" name="id" value={c.id} />
          <p>Clients with quotations or invoices can’t be deleted.</p>
          <button type="submit" className="btn btn--danger btn--sm">Delete client</button>
        </ActForm>
      )}
    </>
  )
}
