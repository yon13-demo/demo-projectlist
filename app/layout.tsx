import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Weaver',
  applicationName: 'Weaver',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body className="bg-gray-50 text-gray-900">{children}</body>
    </html>
  )
}
