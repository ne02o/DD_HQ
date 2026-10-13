'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Mark } from '@/components/documents/parts'

const NAV = [
  { href: '/', label: 'Dashboard' },
  { href: '/invoices', label: 'Invoices' },
  { href: '/quotations', label: 'Quotations' },
  { href: '/clients', label: 'Clients' },
  { href: '/expenses', label: 'Expenses' },
  { href: '/settings', label: 'Settings' },
]

export default function Sidebar() {
  const path = usePathname()
  const active = (href: string) => (href === '/' ? path === '/' : path === href || path.startsWith(href + '/'))
  return (
    <aside className="side">
      <Link href="/" className="side__brand" aria-label="Digital Dive HQ, dashboard">
        <Mark className="side__mark" disc="#FF5A1F" glyph="#141416" label={null} />
        <span>Digital Dive <em>HQ</em></span>
      </Link>
      <nav className="side__nav">
        {NAV.map((n) => (
          <Link key={n.href} href={n.href} className={active(n.href) ? 'is-active' : undefined} aria-current={active(n.href) ? 'page' : undefined}>
            {n.label}
          </Link>
        ))}
      </nav>
    </aside>
  )
}
