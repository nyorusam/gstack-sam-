import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'ARIA — Autonomous Incident Response Intelligence Agent',
  description: '5-agent AI pipeline for enterprise incident resolution. Powered by Gemini Flash, Gemini Pro, and Claude Sonnet.'
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
