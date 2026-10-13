'use client'
import { useEffect, useState } from 'react'

type Theme = 'system' | 'light' | 'dark'
const KEY = 'dd-hq-theme'

/** System follows the device; Light or Dark overrides it on this browser. */
export default function ThemeSwitch() {
  const [theme, setTheme] = useState<Theme>('system')

  useEffect(() => {
    try {
      const saved = localStorage.getItem(KEY)
      if (saved === 'light' || saved === 'dark') setTheme(saved)
    } catch {}
  }, [])

  const choose = (t: Theme) => {
    setTheme(t)
    const root = document.documentElement
    if (t === 'system') delete root.dataset.theme
    else root.dataset.theme = t
    try {
      if (t === 'system') localStorage.removeItem(KEY)
      else localStorage.setItem(KEY, t)
    } catch {}
  }

  return (
    <div className="theme">
      <span>Theme</span>
      <div className="seg" role="group" aria-label="Theme">
        {(['system', 'light', 'dark'] as Theme[]).map((t) => (
          <button key={t} type="button" className={theme === t ? 'is-on' : undefined} aria-pressed={theme === t} onClick={() => choose(t)}>
            {t[0].toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>
    </div>
  )
}

/** Runs before first paint so a saved Light/Dark choice never flashes the other theme. */
export const themeBootScript = `try{var t=localStorage.getItem('${KEY}');if(t==='light'||t==='dark')document.documentElement.dataset.theme=t}catch(e){}`
