import type { Metadata, Viewport } from 'next'
import { GeistSans } from 'geist/font/sans'
import './globals.css'

export const metadata: Metadata = {
  title: 'Saxa – boka frisör',
  description: 'Enkel bokning för frisörer och barbers.',
}
export const viewport: Viewport = { themeColor: '#0a0a0b', width: 'device-width', initialScale: 1 }

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="sv" className={GeistSans.variable}>
      <body className="font-sans antialiased">{children}</body>
    </html>
  )
}
