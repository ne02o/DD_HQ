import Sidebar from '@/components/ui/Sidebar'
import { requireUser } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser()
  return (
    <div className="app">
      <Sidebar userName={user.name} />
      <main className="main">{children}</main>
    </div>
  )
}
