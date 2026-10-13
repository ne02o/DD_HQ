import Link from 'next/link'
import PrintButton from '@/app/preview/PrintButton'
import { Status } from './bits'

/** Toolbar above a document page. The page itself prints alone; the toolbar is hidden in print. */
export default function DocView({ back, backLabel, status, children }: { back: string; backLabel: string; status: string; children: React.ReactNode }) {
  return (
    <div className="docview">
      <div className="docview__bar">
        <Link href={back} className="link">{backLabel}</Link>
        <Status status={status} />
        <PrintButton />
      </div>
      <div className="docview__paper">{children}</div>
    </div>
  )
}
