'use client'

import React from 'react'

interface ErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
  error?: Error
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error Boundary caught an error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 m-4">
            <h3 className="text-red-800 font-semibold mb-2">Something went wrong</h3>
            <p className="text-red-600 text-sm">
              The AI trading interface encountered an error. Please refresh the page.
            </p>
            <button 
              onClick={() => window.location.reload()}
              className="mt-3 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
            >
              Refresh Page
            </button>
          </div>
        )
      )
    }

    return this.props.children
  }
}

// Safe value helper function
export function safeValue<T>(value: T | undefined | null, fallback: T): T {
  return value !== undefined && value !== null ? value : fallback
}

// Safe number formatter
export function safeNumber(value: any, fallback: number = 0): number {
  const num = typeof value === 'number' ? value : Number(value)
  return isNaN(num) ? fallback : num
}

// Safe locale string formatter  
export function safeLocaleString(value: any, fallback: number = 0): string {
  return safeNumber(value, fallback).toLocaleString()
}

// Safe date formatter
export function safeDate(value: any, fallback?: Date): string {
  try {
    const date = value ? new Date(value) : (fallback || new Date())
    return date.toLocaleString()
  } catch (error) {
    return new Date().toLocaleString()
  }
}