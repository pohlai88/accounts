import type { Viewport, Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Providers from './providers'

const inter = Inter({ subsets: ['latin'] })

// ✅ Move themeColor to the viewport export (not metadata)
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  // Light/Dark aware theme color
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0b0b0f' },
  ],
};

// Keep other tags in metadata (but NOT themeColor)
export const metadata: Metadata = {
  title: { default: 'AI-BOS Accounting', template: '%s · AI-BOS Accounting' },
  description: 'Modern, multi-tenant cloud accounting system with AR, AP, GL, and financial reporting',
  keywords: ['accounting', 'cloud', 'multi-tenant', 'financial', 'reports', 'invoicing'],
  authors: [{ name: 'AIBOS Team' }],
}


export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className={`${inter.className} min-h-screen bg-[var(--sys-bg-primary)] text-[var(--sys-text-primary)] antialiased`}>
        <Providers>
          <div className="relative flex min-h-screen flex-col">
            <div className="flex-1">
              {children}
            </div>
          </div>
        </Providers>
      </body>
    </html>
  )
}