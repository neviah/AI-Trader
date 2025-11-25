import { NextRequest, NextResponse } from 'next/server'

// Mock user database
const mockUserData: Record<string, any> = {
  'user-123': {
    id: 'user-123',
    email: 'demo@aitrader.com',
    fullName: 'Demo User',
    tier: 'free',
    balance: {
      total: 10000,
      trading: 7500,
      available: 2500
    },
    preferences: {
      strategy: 'moderate',
      riskTolerance: 'medium',
      notifications: true
    },
    createdAt: '2025-11-19T00:00:00Z',
    lastActiveAt: '2025-11-19T14:30:00Z'
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    const userData = mockUserData[userId]

    if (!userData) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(userData)
  } catch (error: any) {
    console.error('Error fetching user data:', error)
    return NextResponse.json(
      { error: 'Failed to fetch user data' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId, updates } = await request.json()

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    if (!mockUserData[userId]) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Update user data
    mockUserData[userId] = {
      ...mockUserData[userId],
      ...updates,
      lastActiveAt: new Date().toISOString()
    }

    return NextResponse.json({
      success: true,
      userData: mockUserData[userId]
    })
  } catch (error: any) {
    console.error('Error updating user data:', error)
    return NextResponse.json(
      { error: 'Failed to update user data' },
      { status: 500 }
    )
  }
}