import type { Metadata, Viewport } from 'next'
import { GeistSans } from 'geist/font/sans'
import ThemeToggle from '@/components/ThemeToggle'
import './globals.css'

export const metadata: Metadata = {
  title: 'Saxa – boka frisör',
  description: 'Enkel bokning för frisörer och barbers.',
}
export const viewport: Viewport = { width: 'device-width', initialScale: 1 }

// Sätter temat innan sidan ritas – ingen "blink"
const themeScript = `try{if(localStorage.getItem('theme')==='light')document.documentElement.classList.add('light')}catch(e){}`

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="sv" className={GeistSans.variable} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="font-sans antialiased">
        <ThemeToggle />
        {children}
      </body>
    </html>
  )
}
