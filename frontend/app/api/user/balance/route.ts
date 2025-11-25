import { NextRequest, NextResponse } from 'next/server'

// Mock user balance data - replace with actual database queries
const mockUserBalances: Record<string, any> = {
  'user-123': {
    total: 10000,
    trading: 7500,
    available: 2500,
    tier: 'free',
    transactions: [
      { id: '1', type: 'deposit', amount: 5000, date: '2025-11-15', status: 'completed' },
      { id: '2', type: 'withdrawal', amount: -1200, date: '2025-11-10', status: 'completed' }
    ]
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

    // TODO: Get user ID from JWT token instead of query params
    // const token = request.headers.get('authorization')
    // const userId = await verifyTokenAndGetUserId(token)

    const userBalance = mockUserBalances[userId] || {
      total: 0,
      trading: 0,
      available: 0,
      tier: 'free',
      transactions: []
    }

    return NextResponse.json(userBalance)
  } catch (error: any) {
    console.error('Balance fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch balance' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId, amount, type, transactionId } = await request.json()

    if (!userId || !amount || !type) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // TODO: Update user balance in database
    // await updateUserBalance(userId, amount, type)
    
    // Mock update for now
    if (mockUserBalances[userId]) {
      if (type === 'deposit') {
        mockUserBalances[userId].total += amount
        mockUserBalances[userId].available += amount
      } else if (type === 'withdrawal') {
        mockUserBalances[userId].total -= amount
        mockUserBalances[userId].available -= amount
      }
      
      mockUserBalances[userId].transactions.unshift({
        id: transactionId || Date.now().toString(),
        type,
        amount: type === 'withdrawal' ? -amount : amount,
        date: new Date().toISOString().split('T')[0],
        status: 'completed'
      })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Balance update error:', error)
    return NextResponse.json(
      { error: 'Failed to update balance' },
      { status: 500 }
    )
  }
}
