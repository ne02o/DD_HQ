import { requireUser } from '@/lib/auth'
import { getSettings } from '@/lib/db/queries'
import { counterFloors } from '@/lib/db/mutations'
import { PageHead } from '@/components/ui/bits'
import SettingsForm from '@/components/forms/SettingsForm'
import PasswordForm from '@/components/forms/PasswordForm'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Settings · Digital Dive HQ' }

export default async function SettingsPage() {
  const user = await requireUser()
  return (
    <>
      <PageHead title="Settings" />
      <SettingsForm s={getSettings()} floors={counterFloors()} />
      <PasswordForm name={user.name} email={user.email} />
    </>
  )
}
