import { NextResponse } from 'next/server'

// Alpaca API client
class AlpacaAPI {
  constructor(apiKey: string, secretKey: string, paperTrading: boolean = true) {
    this.apiKey = apiKey
    this.secretKey = secretKey
    this.paperTrading = paperTrading
    this.baseUrl = paperTrading 
      ? 'https://paper-api.alpaca.markets'
      : 'https://api.alpaca.markets'
  }

  private apiKey: string
  private secretKey: string
  private paperTrading: boolean
  private baseUrl: string

  async getAccount() {
    try {
      const response = await fetch(`${this.baseUrl}/v2/account`, {
        headers: {
          'APCA-API-KEY-ID': this.apiKey,
          'APCA-API-SECRET-KEY': this.secretKey,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error(`Alpaca API error: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Failed to get account info:', error)
      throw error
    }
  }

  async submitOrder(symbol: string, qty: number, side: 'buy' | 'sell') {
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
          qty,
          side,
          type: 'market',
          time_in_force: 'gtc'
        })
      })

      if (!response.ok) {
        throw new Error(`Alpaca API error: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Failed to submit order:', error)
      throw error
    }
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

    const alpaca = new AlpacaAPI(apiKey, secretKey, paperTrading)
    const account = await alpaca.getAccount()
    
    return NextResponse.json({
      success: true,
      account: {
        account_id: account.account_number || account.id,
        buying_power: parseFloat(account.buying_power || '0'),
        cash: parseFloat(account.cash || '0'),
        portfolio_value: parseFloat(account.portfolio_value || '0'),
        equity: parseFloat(account.equity || '0'),
        day_trade_count: parseInt(account.daytrade_buying_power || '0'),
        status: account.status || 'UNKNOWN',
        paper_trading: paperTrading
      }
    })
  } catch (error: any) {
    console.error('Alpaca API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch account info', details: error.message },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const { action, symbol, quantity } = await request.json()
    
    const apiKey = process.env.ALPACA_API_KEY
    const secretKey = process.env.ALPACA_SECRET_KEY
    const paperTrading = process.env.ALPACA_PAPER_TRADING === 'true'

    if (!apiKey || !secretKey) {
      return NextResponse.json(
        { error: 'Alpaca API credentials not configured' },
        { status: 500 }
      )
    }

    const alpaca = new AlpacaAPI(apiKey, secretKey, paperTrading)
    const order = await alpaca.submitOrder(symbol, parseFloat(quantity), action)
    
    return NextResponse.json({
      success: true,
      order: {
        order_id: order.id,
        symbol: order.symbol,
        quantity: parseFloat(order.qty),
        side: order.side,
        order_type: order.type,
        status: order.status,
        submitted_at: order.submitted_at,
        filled_qty: parseFloat(order.filled_qty || '0'),
        filled_avg_price: parseFloat(order.filled_avg_price || '0')
      }
    })
  } catch (error: any) {
    console.error('Alpaca trade error:', error)
    return NextResponse.json(
      { error: 'Failed to execute trade', details: error.message },
      { status: 500 }
    )
  }
}