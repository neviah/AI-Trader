import { NextRequest, NextResponse } from 'next/server'

// Simulate user portfolio that's synchronized with master AI
async function getUserPortfolio(userId: string) {
  // In production, this would come from database
  const masterPortfolio = {
    holdings: [
      { symbol: 'AAPL', weight: 0.20, entryPrice: 175.50, entryDate: '2024-11-15' },
      { symbol: 'GOOGL', weight: 0.15, entryPrice: 142.30, entryDate: '2024-11-14' },
      { symbol: 'MSFT', weight: 0.18, entryPrice: 378.90, entryDate: '2024-11-12' },
      { symbol: 'NVDA', weight: 0.12, entryPrice: 445.20, entryDate: '2024-11-10' },
      { symbol: 'TSLA', weight: 0.10, entryPrice: 242.80, entryDate: '2024-11-08' }
    ],
    cash: 0.25
  }

  // User's individual portfolio based on their investment amount
  const userInvestment = 15000 // User's total investment
  const userPortfolio = masterPortfolio.holdings.map(holding => {
    const allocation = userInvestment * holding.weight
    const currentPrice = holding.entryPrice * (1 + (Math.random() - 0.5) * 0.1) // Simulate price movement
    const shares = Math.floor(allocation / holding.entryPrice)
    const marketValue = shares * currentPrice
    const pnl = marketValue - (shares * holding.entryPrice)
    
    return {
      symbol: holding.symbol,
      shares,
      entryPrice: holding.entryPrice,
      currentPrice: currentPrice,
      marketValue: marketValue,
      costBasis: shares * holding.entryPrice,
      unrealizedPnl: pnl,
      pnlPercent: (pnl / (shares * holding.entryPrice)) * 100,
      weight: holding.weight,
      entryDate: holding.entryDate,
      aiManaged: true // This position is managed by AI
    }
  })

  const totalMarketValue = userPortfolio.reduce((sum, pos) => sum + pos.marketValue, 0)
  const totalCostBasis = userPortfolio.reduce((sum, pos) => sum + pos.costBasis, 0)
  const totalPnl = totalMarketValue - totalCostBasis
  const cash = userInvestment * masterPortfolio.cash

  return {
    userId,
    positions: userPortfolio,
    cash: cash,
    totalInvestment: userInvestment,
    totalMarketValue: totalMarketValue + cash,
    totalPnl: totalPnl,
    totalPnlPercent: (totalPnl / totalCostBasis) * 100,
    syncedWithAI: true,
    lastAIUpdate: '2024-11-19T10:30:00Z',
    aiDecisionId: 'ai-decision-12891'
  }
}

// Simulate recent AI trading activity
async function getRecentAIActivity() {
  return [
    {
      timestamp: '2024-11-19T09:45:00Z',
      action: 'REBALANCE',
      description: 'AI increased NVDA allocation from 10% to 12%',
      affectedUsers: 1247,
      reasoning: 'Strong earnings momentum and AI chip demand'
    },
    {
      timestamp: '2024-11-18T14:20:00Z',
      action: 'SELL',
      symbol: 'META',
      description: 'AI sold META positions (5% allocation)',
      affectedUsers: 1247,
      reasoning: 'Regulatory concerns and valuation risk'
    },
    {
      timestamp: '2024-11-17T11:15:00Z',
      action: 'BUY',
      symbol: 'TSLA',
      description: 'AI added TSLA to portfolio (10% allocation)',
      affectedUsers: 1247,
      reasoning: 'Autonomous driving breakthroughs and production scaling'
    }
  ]
}

export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get('userId') || 'user-demo'
    
    const userPortfolio = await getUserPortfolio(userId)
    const recentActivity = await getRecentAIActivity()
    
    return NextResponse.json({
      success: true,
      portfolio: userPortfolio,
      recentAIActivity: recentActivity,
      platformStats: {
        totalUsers: 1247,
        totalAUM: 45_600_000, // $45.6M assets under management
        aiUptime: 99.8,
        avgReturn: 12.4 // 12.4% average return
      },
      timestamp: new Date().toISOString()
    })

  } catch (error: any) {
    console.error('❌ User portfolio error:', error)
    return NextResponse.json(
      { error: 'Failed to get user portfolio', details: error.message },
      { status: 500 }
    )
  }
}