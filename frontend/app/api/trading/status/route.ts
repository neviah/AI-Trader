import { NextRequest, NextResponse } from 'next/server'

// Mock trading agent data
const mockAgentData: Record<string, any> = {
  'user-123': {
    agentId: 'agent-user-123-1732143923456',
    status: 'active',
    startedAt: '2025-11-19T12:00:00Z',
    strategy: 'moderate',
    totalTrades: 14,
    profitableTrades: 9,
    totalProfit: 1247.83,
    todayTrades: 3,
    lastTradeAt: '2025-11-19T14:30:00Z',
    recentTrades: [
      {
        symbol: 'AAPL',
        action: 'BUY',
        quantity: 100,
        price: 174.50,
        profit: 120,
        time: '2 min ago',
        reasoning: 'Strong momentum and positive earnings sentiment'
      },
      {
        symbol: 'TSLA', 
        action: 'SELL',
        quantity: 50,
        price: 242.80,
        profit: 890,
        time: '15 min ago',
        reasoning: 'Profit-taking after 12% gain, overbought signals'
      },
      {
        symbol: 'NVDA',
        action: 'BUY', 
        quantity: 25,
        price: 445.20,
        profit: 340,
        time: '32 min ago',
        reasoning: 'AI sector rotation, institutional buying detected'
      }
    ]
  }
}

export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    const agentData = mockAgentData[userId]
    
    if (!agentData) {
      return NextResponse.json({
        hasAgent: false,
        message: 'No trading agent found for this user'
      })
    }

    return NextResponse.json({
      hasAgent: true,
      ...agentData
    })
  } catch (error: any) {
    console.error('Error getting trading status:', error)
    return NextResponse.json(
      { error: 'Failed to get trading status' },
      { status: 500 }
    )
  }
}
