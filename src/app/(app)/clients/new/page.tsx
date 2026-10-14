import { requireUser } from '@/lib/auth'
import { PageHead } from '@/components/ui/bits'
import ClientForm from '@/components/forms/ClientForm'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'New client · Digital Dive HQ' }

export default async function NewClientPage({ searchParams }: { searchParams: Promise<{ return?: string }> }) {
  await requireUser()
  const r = (await searchParams).return ?? null
  const returnTo = r && r.startsWith('/') && !r.startsWith('//') ? r : null
  return (
    <>
      <PageHead title="New client" />
      <ClientForm client={null} returnTo={returnTo} />
    </>
  )
}
