import { NextRequest, NextResponse } from 'next/server'

// Mock transaction database
const mockTransactions: Record<string, any[]> = {
  'user-123': [
    {
      id: 'txn-001',
      type: 'deposit',
      amount: 5000,
      status: 'completed',
      date: '2025-11-15T10:00:00Z',
      description: 'Stripe deposit',
      paymentMethod: 'card',
      stripeId: 'pi_1234567890'
    },
    {
      id: 'txn-002',
      type: 'withdrawal',
      amount: -1200,
      status: 'completed',
      date: '2025-11-10T15:30:00Z',
      description: 'Bank transfer withdrawal',
      paymentMethod: 'ach',
      stripeId: 'po_0987654321'
    },
    {
      id: 'txn-003',
      type: 'trade',
      amount: 247.83,
      status: 'completed',
      date: '2025-11-19T14:25:00Z',
      description: 'AI trading profit - AAPL',
      symbol: 'AAPL',
      quantity: 100,
      price: 174.50
    }
  ]
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const limit = parseInt(searchParams.get('limit') || '50')
    const type = searchParams.get('type') // 'deposit', 'withdrawal', 'trade'

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    let transactions = mockTransactions[userId] || []

    // Filter by type if specified
    if (type) {
      transactions = transactions.filter(tx => tx.type === type)
    }

    // Sort by date (newest first) and limit
    transactions = transactions
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, limit)

    return NextResponse.json({
      transactions,
      total: transactions.length
    })
  } catch (error: any) {
    console.error('Error fetching transactions:', error)
    return NextResponse.json(
      { error: 'Failed to fetch transactions' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId, transaction } = await request.json()

    if (!userId || !transaction) {
      return NextResponse.json(
        { error: 'User ID and transaction data are required' },
        { status: 400 }
      )
    }

    // Initialize user transactions if not exists
    if (!mockTransactions[userId]) {
      mockTransactions[userId] = []
    }

    // Add new transaction
    const newTransaction = {
      id: `txn-${Date.now()}`,
      ...transaction,
      date: new Date().toISOString()
    }

    mockTransactions[userId].unshift(newTransaction)

    return NextResponse.json({
      success: true,
      transaction: newTransaction
    })
  } catch (error: any) {
    console.error('Error creating transaction:', error)
    return NextResponse.json(
      { error: 'Failed to create transaction' },
      { status: 500 }
    )
  }
}