import type { Metadata } from 'next'
import '@fontsource-variable/source-sans-3'
import './globals.css'

export const metadata: Metadata = {
  title: 'Digital Dive HQ',
  robots: { index: false, follow: false },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
