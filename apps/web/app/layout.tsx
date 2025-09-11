import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'AIBOS Accounts',
  description: 'Multi-tenant accounting platform',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
