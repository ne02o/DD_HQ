'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { Mark } from '@/components/documents/parts'
import ThemeSwitch from './ThemeSwitch'
import { logoutAction } from '@/app/login/actions'

const NAV = [
  { href: '/', label: 'Dashboard' },
  { href: '/invoices', label: 'Invoices' },
  { href: '/quotations', label: 'Quotations' },
  { href: '/clients', label: 'Clients' },
  { href: '/expenses', label: 'Expenses' },
  { href: '/settings', label: 'Settings' },
]

function Arrow({ current }: { current: boolean }) {
  return (
    <svg className="mnav__arrow" viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
      {current
        ? <path d="M7 7l10 10M17 9v8H9" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        : <path d="M5 12h14M13 6l6 6-6 6" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />}
    </svg>
  )
}

/** Sidebar on desktop. On phones: a slim top bar, and a full-height menu panel over the page. */
export default function Sidebar({ userName }: { userName: string }) {
  const path = usePathname()
  const [open, setOpen] = useState(false)
  const closeBtn = useRef<HTMLButtonElement>(null)
  const active = (href: string) => (href === '/' ? path === '/' : path === href || path.startsWith(href + '/'))

  useEffect(() => { setOpen(false) }, [path])
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    window.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    closeBtn.current?.focus()
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [open])

  return (
    <aside className="side">
      <Link href="/" className="side__brand" aria-label="Digital Dive HQ, dashboard">
        <Mark className="side__mark" disc="#FF5A1F" glyph="#141416" label={null} />
        <span>Digital Dive <em>HQ</em></span>
      </Link>

      <button type="button" className="side__burger" aria-expanded={open} aria-controls="mnav" aria-label="Open menu" onClick={() => setOpen(true)}>
        <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
          <path d="M4 8h16M4 16h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </button>

      {/* Desktop */}
      <div className="side__menu">
        <nav className="side__nav" aria-label="Main">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} className={active(n.href) ? 'is-active' : undefined} aria-current={active(n.href) ? 'page' : undefined}>
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="side__foot">
          <ThemeSwitch />
          <form action={logoutAction} className="side__user">
            <span>{userName}</span>
            <button type="submit" className="link-btn">Sign out</button>
          </form>
        </div>
      </div>

      {/* Phones */}
      <div className={`mnav${open ? ' is-open' : ''}`} id="mnav" aria-hidden={!open}>
        <div className="mnav__scrim" onClick={() => setOpen(false)} />
        <div className="mnav__panel" role="dialog" aria-modal="true" aria-label="Menu">
          <div className="mnav__top">
            <Mark className="mnav__mark" disc="#FF5A1F" glyph="#141416" label={null} />
            <button ref={closeBtn} type="button" className="mnav__close" aria-label="Close menu" onClick={() => setOpen(false)} tabIndex={open ? 0 : -1}>
              <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
                <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
            </button>
          </div>
          <nav className="mnav__links" aria-label="Main">
            {NAV.map((n) => {
              const cur = active(n.href)
              return (
                <Link key={n.href} href={n.href} className={cur ? 'is-current' : undefined} aria-current={cur ? 'page' : undefined} tabIndex={open ? 0 : -1} onClick={() => setOpen(false)}>
                  <span>{n.label}</span>
                  <Arrow current={cur} />
                </Link>
              )
            })}
          </nav>
          <div className="mnav__foot">
            <ThemeSwitch />
            <form action={logoutAction} className="mnav__user">
              <span>{userName}</span>
              <button type="submit" tabIndex={open ? 0 : -1}>Sign out</button>
            </form>
          </div>
        </div>
      </div>
    </aside>
  )
}
