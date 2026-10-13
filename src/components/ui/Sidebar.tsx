'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Mark } from '@/components/documents/parts'

const NAV = [
  { href: '/', label: 'Dashboard' },
  { href: '/invoices', label: 'Invoices' },
  { href: '/quotations', label: 'Quotations' },
  { href: '/clients', label: 'Clients' },
  { href: '/expenses', label: 'Expenses' },
  { href: '/settings', label: 'Settings' },
]

/** Sidebar on desktop; on phones a top bar with a menu button that drops the links down. */
export default function Sidebar() {
  const path = usePathname()
  const [open, setOpen] = useState(false)
  const active = (href: string) => (href === '/' ? path === '/' : path === href || path.startsWith(href + '/'))

  // Close after navigating, and on Escape.
  useEffect(() => { setOpen(false) }, [path])
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  return (
    <aside className={`side${open ? ' is-open' : ''}`}>
      <Link href="/" className="side__brand" aria-label="Digital Dive HQ, dashboard">
        <Mark className="side__mark" disc="#FF5A1F" glyph="#141416" label={null} />
        <span>Digital Dive <em>HQ</em></span>
      </Link>
      <button
        type="button"
        className="side__burger"
        aria-expanded={open}
        aria-controls="side-nav"
        aria-label={open ? 'Close menu' : 'Open menu'}
        onClick={() => setOpen((o) => !o)}
      >
        <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
          {open
            ? <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            : <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />}
        </svg>
      </button>
      <nav id="side-nav" className="side__nav">
        {NAV.map((n) => (
          <Link key={n.href} href={n.href} className={active(n.href) ? 'is-active' : undefined} aria-current={active(n.href) ? 'page' : undefined}>
            {n.label}
          </Link>
        ))}
      </nav>
    </aside>
  )
}
