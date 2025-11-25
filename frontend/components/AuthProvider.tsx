'use client'

import { useEffect } from 'react'
import { useAuth } from '@/lib/auth'

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const { initialize, isInitialized } = useAuth()

  useEffect(() => {
    if (!isInitialized) {
      initialize()
    }
  }, [initialize, isInitialized])

  return <>{children}</>
}