import { NewDocPage } from '@/components/forms/docPages'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'New quotation · Digital Dive HQ' }

export default function Page({ searchParams }: { searchParams: Promise<{ client?: string }> }) {
  return <NewDocPage kind="quotation" searchParams={searchParams} />
}
