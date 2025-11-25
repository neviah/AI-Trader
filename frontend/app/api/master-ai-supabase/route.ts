import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, userId, symbols, riskLevel } = body

    console.log('API Request:', { action, userId, symbols, riskLevel })

    // Provide default userId if missing
    const effectiveUserId = userId || 'demo-user'

    // Check if Supabase is configured
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      console.log('Supabase env vars missing')
      return NextResponse.json({ 
        error: 'Supabase not configured',
        message: 'Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY environment variables'
      }, { status: 500 })
    }

    switch (action) {
      case 'onboard':
        console.log('Onboarding user:', effectiveUserId)
        return NextResponse.json({
          success: true,
          message: 'User onboarded successfully',
          initialBalance: 100000
        })

      case 'analyze':
        console.log('Running analysis for symbols:', symbols)
        const defaultSymbols = symbols || ['AAPL', 'GOOGL', 'MSFT', 'AMZN', 'NVDA']
        const mockDecisions = generateMockDecisions(defaultSymbols)
        
        return NextResponse.json({
          success: true,
          decisions: mockDecisions,
          aiDecisions: mockDecisions,
          affectedUsers: 1200,
          timestamp: new Date().toISOString(),
          paperTrading: true,
          source: 'demo'
        })

      case 'execute':
        console.log('Executing trade')
        return NextResponse.json({
          success: true,
          position: { id: 'demo-trade-1', symbol: 'AAPL', quantity: 10, price: 175 },
          portfolioValue: { total: 100000, cash: 80000, positions: 20000 }
        })

      default:
        console.log('Unknown action:', action)
        return NextResponse.json({ 
          error: 'Invalid action', 
          action: action,
          availableActions: ['onboard', 'analyze', 'execute']
        }, { status: 400 })
    }
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    // Return demo portfolio status
    return NextResponse.json({
      success: true,
      status: 'active',
      portfolio: {
        positions: [],
        value: {
          total: 100000,
          cash: 80000,
          positions: 20000,
          dailyPnl: 250,
          totalPnl: 1500
        },
        performance: {
          totalReturn: 1.5,
          sharpeRatio: 1.2,
          maxDrawdown: 2.1,
          winRate: 65
        }
      },
      masterPortfolio: {
        totalUsers: 1200,
        lastUpdated: new Date().toISOString(),
        totalValue: 50000000,
        performanceToday: 2.3,
        cash: 0.05, // 5% cash
        holdings: [
          { symbol: 'AAPL', percentage: 15, weight: 0.15, value: 7500000, change: 2.1 },
          { symbol: 'MSFT', percentage: 12, weight: 0.12, value: 6000000, change: 1.8 },
          { symbol: 'GOOGL', percentage: 10, weight: 0.10, value: 5000000, change: -0.5 },
          { symbol: 'AMZN', percentage: 8, weight: 0.08, value: 4000000, change: 3.2 },
          { symbol: 'NVDA', percentage: 7, weight: 0.07, value: 3500000, change: 4.5 }
        ]
      },
      recentDecisions: generateMockDecisions(['AAPL', 'MSFT'])
    })
  } catch (error) {
    console.error('GET error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

function generateMockDecisions(symbols: string[]) {
  return symbols.slice(0, 3).map((symbol, index) => ({
    id: `mock-${Date.now()}-${index}`,
    symbol,
    action: (['buy', 'sell', 'hold'] as const)[Math.floor(Math.random() * 3)],
    reasoning: `AI analysis indicates ${symbol} shows strong technical patterns`,
    confidence: 0.75 + Math.random() * 0.2,
    target_price: 100 + Math.random() * 300,
    current_price: 90 + Math.random() * 280,
    targetPrice: 100 + Math.random() * 300, // Legacy field
    currentPrice: 90 + Math.random() * 280, // Legacy field
    technical_factors: ['RSI oversold', 'Moving average crossover'],
    fundamental_factors: ['Strong earnings', 'Positive outlook'],
    timestamp: new Date().toISOString(),
    created_at: new Date().toISOString()
  }))
}

function calculatePortfolioValue(positions: any[]) {
  // Simple portfolio calculation - would be more sophisticated in production
  const initialCash = 100000
  const totalInvested = positions.reduce((sum, pos) => sum + (pos.quantity * pos.price), 0)
  const unrealizedPnl = positions.reduce((sum, pos) => {
    // Mock current value calculation
    const currentValue = pos.quantity * pos.price * (1 + (Math.random() - 0.5) * 0.1)
    return sum + (currentValue - pos.quantity * pos.price)
  }, 0)

  return {
    total: initialCash + unrealizedPnl,
    cash: initialCash - totalInvested,
    positions: totalInvested + unrealizedPnl,
    dailyPnl: unrealizedPnl * 0.1, // Mock daily change
    totalPnl: unrealizedPnl
  }
}