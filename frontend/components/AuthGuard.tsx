'use client'

import { useAuth } from '@/lib/auth'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, isInitialized, initialize } = useAuth()
  const router = useRouter()

  useEffect(() => {
    // Initialize auth state from localStorage on component mount
    if (!isInitialized) {
      initialize()
    }
  }, [isInitialized, initialize])

  useEffect(() => {
    // Only redirect if initialization is complete and user is not authenticated
    if (isInitialized && !isLoading && !isAuthenticated) {
      router.push('/auth/login')
    }
  }, [isAuthenticated, isLoading, isInitialized, router])

  // Show loading while initializing or loading
  if (!isInitialized || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  // Don't render children until we know auth status
  if (!isAuthenticated) {
    return null
  }

  return <>{children}</>
}
