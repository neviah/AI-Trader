import { NextResponse } from 'next/server'

// Simplified AI Trading Logic for Web Demo
class AITrader {
  private apiKey: string
  private secretKey: string
  private paperTrading: boolean
  private baseUrl: string

  constructor(apiKey: string, secretKey: string, paperTrading: boolean = true) {
    this.apiKey = apiKey
    this.secretKey = secretKey
    this.paperTrading = paperTrading
    this.baseUrl = paperTrading 
      ? 'https://paper-api.alpaca.markets'
      : 'https://api.alpaca.markets'
  }

  // Get real market data
  async getMarketData(symbol: string) {
    try {
      const response = await fetch(`${this.baseUrl}/v2/stocks/${symbol}/bars?timeframe=1Day&limit=10`, {
        headers: {
          'APCA-API-KEY-ID': this.apiKey,
          'APCA-API-SECRET-KEY': this.secretKey
        }
      })
      
      if (!response.ok) {
        throw new Error(`Failed to get market data for ${symbol}`)
      }
      
      return await response.json()
    } catch (error) {
      console.error(`Error getting market data for ${symbol}:`, error)
      return null
    }
  }

  // Simple momentum trading strategy
  analyzeTrend(bars: any[]): 'buy' | 'sell' | 'hold' {
    if (!bars || bars.length < 3) return 'hold'

    const recent = bars.slice(-3)
    const prices = recent.map(bar => parseFloat(bar.c)) // closing prices
    
    // Simple momentum: if price increased for 2 days straight, consider buying
    if (prices[2] > prices[1] && prices[1] > prices[0]) {
      return 'buy'
    }
    
    // If price decreased for 2 days straight, consider selling
    if (prices[2] < prices[1] && prices[1] < prices[0]) {
      return 'sell'
    }
    
    return 'hold'
  }

  // Execute trade based on AI decision
  async executeTrade(symbol: string, action: 'buy' | 'sell', quantity: number = 1) {
    try {
      const response = await fetch(`${this.baseUrl}/v2/orders`, {
        method: 'POST',
        headers: {
          'APCA-API-KEY-ID': this.apiKey,
          'APCA-API-SECRET-KEY': this.secretKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          symbol: symbol.toUpperCase(),
          qty: quantity,
          side: action,
          type: 'market',
          time_in_force: 'gtc'
        })
      })

      if (!response.ok) {
        throw new Error(`Failed to execute ${action} order for ${symbol}`)
      }

      return await response.json()
    } catch (error) {
      console.error(`Error executing trade for ${symbol}:`, error)
      throw error
    }
  }

  // Check current positions
  async getCurrentPositions() {
    try {
      const response = await fetch(`${this.baseUrl}/v2/positions`, {
        headers: {
          'APCA-API-KEY-ID': this.apiKey,
          'APCA-API-SECRET-KEY': this.secretKey
        }
      })

      if (!response.ok) {
        throw new Error('Failed to get current positions')
      }

      return await response.json()
    } catch (error) {
      console.error('Error getting positions:', error)
      return []
    }
  }

  // AI Trading Decision Engine
  async makeTradeDecision(symbol: string): Promise<{
    symbol: string,
    action: 'buy' | 'sell' | 'hold',
    reasoning: string,
    confidence: number,
    order?: any
  }> {
    try {
      // Get market data
      const marketData = await this.getMarketData(symbol)
      if (!marketData?.bars) {
        return {
          symbol,
          action: 'hold',
          reasoning: 'No market data available',
          confidence: 0
        }
      }

      // Analyze trend
      const action = this.analyzeTrend(marketData.bars)
      const latestPrice = parseFloat(marketData.bars[marketData.bars.length - 1]?.c || '0')
      
      let reasoning = ''
      let confidence = 0.6 // Base confidence

      if (action === 'buy') {
        reasoning = `Upward momentum detected. Recent prices show consistent increase. Latest: $${latestPrice}`
        confidence = 0.7
      } else if (action === 'sell') {
        reasoning = `Downward trend detected. Recent prices show consistent decrease. Latest: $${latestPrice}`
        confidence = 0.7
      } else {
        reasoning = `Market shows sideways movement. Holding position. Latest: $${latestPrice}`
        confidence = 0.5
      }

      // Execute trade if action is buy or sell
      let order = null
      if (action === 'buy' || action === 'sell') {
        try {
          // Check current positions first
          const positions = await this.getCurrentPositions()
          const currentPosition = positions.find((pos: any) => pos.symbol === symbol)
          
          if (action === 'buy' && currentPosition) {
            reasoning += ' (Already have position, skipping buy)'
            return { symbol, action: 'hold', reasoning, confidence: 0.3 }
          }
          
          if (action === 'sell' && !currentPosition) {
            reasoning += ' (No position to sell, skipping)'
            return { symbol, action: 'hold', reasoning, confidence: 0.3 }
          }

          // Execute the trade
          order = await this.executeTrade(symbol, action, 1)
          reasoning += ` Trade executed: ${action} 1 share`
        } catch (error) {
          reasoning += ` Trade failed: ${error}`
          confidence = 0.2
        }
      }

      return {
        symbol,
        action,
        reasoning,
        confidence,
        order
      }
    } catch (error) {
      return {
        symbol,
        action: 'hold',
        reasoning: `Analysis failed: ${error}`,
        confidence: 0
      }
    }
  }
}

export async function POST(request: Request) {
  try {
    const { symbols, mode } = await request.json()
    
    const apiKey = process.env.ALPACA_API_KEY
    const secretKey = process.env.ALPACA_SECRET_KEY
    const paperTrading = process.env.ALPACA_PAPER_TRADING === 'true'

    if (!apiKey || !secretKey) {
      return NextResponse.json(
        { error: 'Alpaca API credentials not configured' },
        { status: 500 }
      )
    }

    const trader = new AITrader(apiKey, secretKey, paperTrading)
    
    // Default to analyzing top tech stocks
    const stocksToAnalyze = symbols || ['AAPL', 'GOOGL', 'MSFT', 'TSLA', 'NVDA']
    
    console.log(`🤖 AI Trader analyzing ${stocksToAnalyze.length} stocks...`)
    
    const results = []
    
    for (const symbol of stocksToAnalyze) {
      console.log(`📊 Analyzing ${symbol}...`)
      
      const decision = await trader.makeTradeDecision(symbol)
      results.push(decision)
      
      // Add small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 500))
    }

    const summary = {
      totalAnalyzed: results.length,
      buySignals: results.filter(r => r.action === 'buy').length,
      sellSignals: results.filter(r => r.action === 'sell').length,
      holdSignals: results.filter(r => r.action === 'hold').length,
      averageConfidence: results.reduce((sum, r) => sum + r.confidence, 0) / results.length,
      executedTrades: results.filter(r => r.order).length
    }

    console.log('🎯 AI Trading Analysis Complete:', summary)

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      mode: mode || 'analysis',
      paperTrading,
      summary,
      decisions: results
    })

  } catch (error: any) {
    console.error('❌ AI Trader error:', error)
    return NextResponse.json(
      { error: 'AI Trading analysis failed', details: error.message },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    const apiKey = process.env.ALPACA_API_KEY
    const secretKey = process.env.ALPACA_SECRET_KEY
    const paperTrading = process.env.ALPACA_PAPER_TRADING === 'true'

    if (!apiKey || !secretKey) {
      return NextResponse.json(
        { error: 'Alpaca API credentials not configured' },
        { status: 500 }
      )
    }

    const trader = new AITrader(apiKey, secretKey, paperTrading)
    
    // Get current positions and account info
    const positions = await trader.getCurrentPositions()
    
    return NextResponse.json({
      success: true,
      paperTrading,
      positions: positions.map((pos: any) => ({
        symbol: pos.symbol,
        quantity: parseFloat(pos.qty),
        marketValue: parseFloat(pos.market_value),
        costBasis: parseFloat(pos.cost_basis),
        unrealizedPnl: parseFloat(pos.unrealized_pl),
        side: pos.side
      })),
      timestamp: new Date().toISOString()
    })

  } catch (error: any) {
    console.error('❌ AI Trader positions error:', error)
    return NextResponse.json(
      { error: 'Failed to get AI trader positions', details: error.message },
      { status: 500 }
    )
  }
}