import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'JobTracker AI',
  description: 'Track your job applications with AI',
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