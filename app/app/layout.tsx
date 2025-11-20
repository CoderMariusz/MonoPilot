import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'MonoPilot - MES System',
  description: 'Manufacturing Execution System for Food Manufacturing',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  )
}
