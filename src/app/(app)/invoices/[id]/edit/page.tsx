import { EditDocPage } from '@/components/forms/docPages'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Edit invoice · Digital Dive HQ' }

export default function Page({ params }: { params: Promise<{ id: string }> }) {
  return <EditDocPage kind="invoice" params={params} />
}
