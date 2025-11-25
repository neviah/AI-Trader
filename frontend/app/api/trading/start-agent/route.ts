import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { userId, strategy, amount } = await request.json()

    if (!userId || !strategy || !amount) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, strategy, amount' },
        { status: 400 }
      )
    }

    if (amount < 100) {
      return NextResponse.json(
        { error: 'Minimum trading amount is $100' },
        { status: 400 }
      )
    }

    // Map strategy to trading config
    const strategyConfig = {
      conservative: {
        maxTradesPerDay: 10,
        stopLossPct: 0.02,
        takeProfitPct: 0.05,
        riskTolerance: 'low',
        useTechnicalAnalysis: true,
        useSentimentAnalysis: false,
        useNewsAnalysis: true
      },
      moderate: {
        maxTradesPerDay: 20,
        stopLossPct: 0.03,
        takeProfitPct: 0.08,
        riskTolerance: 'medium',
        useTechnicalAnalysis: true,
        useSentimentAnalysis: true,
        useNewsAnalysis: true
      },
      aggressive: {
        maxTradesPerDay: 50,
        stopLossPct: 0.05,
        takeProfitPct: 0.15,
        riskTolerance: 'high',
        useTechnicalAnalysis: true,
        useSentimentAnalysis: true,
        useNewsAnalysis: true
      }
    }

    const config = strategyConfig[strategy as keyof typeof strategyConfig]
    if (!config) {
      return NextResponse.json(
        { error: 'Invalid strategy. Must be conservative, moderate, or aggressive' },
        { status: 400 }
      )
    }

    // TODO: Call actual AI trading backend
    // const tradingAPI = process.env.TRADING_BACKEND_URL || 'http://localhost:8090'
    // const response = await fetch(`${tradingAPI}/api/agents/start`, {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ userId, amount, config })
    // })

    // Mock response for now
    const agentId = `agent-${userId}-${Date.now()}`
    
    console.log(`Starting AI trading agent:`, {
      agentId,
      userId,
      strategy,
      amount,
      config
    })

    return NextResponse.json({
      success: true,
      agentId,
      message: `AI trading agent started with ${strategy} strategy for $${amount}`,
      config
    })
  } catch (error: any) {
    console.error('Error starting trading agent:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to start trading agent' },
      { status: 500 }
    )
  }
}
