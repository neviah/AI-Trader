import type { Metadata } from 'next'
import '@/styles/globals.css'
import AuthProvider from '@/components/AuthProvider'

export const metadata: Metadata = {
  title: 'AI Trader - Autonomous Trading Platform',
  description: 'AI-powered trading platform using DeepSeek for autonomous NASDAQ stock trading',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}