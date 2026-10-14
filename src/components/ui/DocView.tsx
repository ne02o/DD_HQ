import Link from 'next/link'
import PrintButton from '@/app/preview/PrintButton'
import { Status } from './bits'
import DocScaler from './DocScaler'

/** Toolbar and optional side panel around a document page. Only the paper prints. */
export default function DocView({
  back, backLabel, status, actions, notice, aside, children,
}: {
  back: string
  backLabel: string
  status: string
  actions?: React.ReactNode
  notice?: string | null
  aside?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div className="docview">
      <div className="docview__bar">
        <Link href={back} className="link">← {backLabel}</Link>
        <Status status={status} />
        <div className="docview__actions">
          {actions}
          <PrintButton />
        </div>
      </div>
      {notice && <p className="form-error" role="alert">{notice}</p>}
      <div className={aside ? 'docview__split' : undefined}>
        <DocScaler>{children}</DocScaler>
        {aside && <aside className="docview__aside">{aside}</aside>}
      </div>
    </div>
  )
}
