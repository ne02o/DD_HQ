import { EditDocPage } from '@/components/forms/docPages'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Edit quotation · Digital Dive HQ' }

export default function Page({ params }: { params: Promise<{ id: string }> }) {
  return <EditDocPage kind="quotation" params={params} />
}
