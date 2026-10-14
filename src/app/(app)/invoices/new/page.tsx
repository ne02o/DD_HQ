import { NewDocPage } from '@/components/forms/docPages'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'New invoice · Digital Dive HQ' }

export default function Page({ searchParams }: { searchParams: Promise<{ client?: string }> }) {
  return <NewDocPage kind="invoice" searchParams={searchParams} />
}
