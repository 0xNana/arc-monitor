import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Arc Monitor | High-Performance Infrastructure',
  description: 'Real-time transaction latency tracking for Arc Testnet',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body className="h-screen overflow-hidden">
        <div className="h-full w-full overflow-hidden">
          {children}
        </div>
      </body>
    </html>
  )
}
