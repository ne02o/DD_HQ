import type { Metadata } from 'next'
import '@fontsource-variable/source-sans-3'
import '@fontsource-variable/inter'
import './globals.css'
import { themeBootScript } from '@/components/ui/ThemeSwitch'

export const metadata: Metadata = {
  title: 'Digital Dive HQ',
  robots: { index: false, follow: false },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBootScript }} />
      </head>
      <body>{children}</body>
    </html>
  )
}
