import { redirect } from 'next/navigation'

// Phase 1: the only screen is the document preview.
export default function Home() {
  redirect('/preview')
}
