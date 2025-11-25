import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

interface Position {
  date: string
  id: number
  this_action?: {
    action: string
    symbol: string
    amount: number
  }
  positions: Record<string, number>
}

export async function GET(request: NextRequest) {
  try {
    // Read portfolio data from the existing data structure
    const dataDir = path.join(process.cwd(), '..', 'data')
    const agents = []

    // Check if data directory exists
    if (!fs.existsSync(dataDir)) {
      return NextResponse.json({
        error: 'No trading data found',
        message: 'Trading system not initialized'
      }, { status: 404 })
    }

    // Read all agent directories
    const agentDirs = fs.readdirSync(dataDir).filter(dir => 
      fs.statSync(path.join(dataDir, dir)).isDirectory()
    )

    for (const agentDir of agentDirs) {
      const positionFile = path.join(dataDir, agentDir, 'position', 'position.jsonl')
      
      if (fs.existsSync(positionFile)) {
        try {
          const lines = fs.readFileSync(positionFile, 'utf-8').trim().split('\n')
          const positions: Position[] = lines
            .filter(line => line.trim())
            .map(line => JSON.parse(line))

          // Get latest position
          const latestPosition = positions[positions.length - 1]
          
          // Calculate total portfolio value (simplified)
          let totalValue = latestPosition?.positions?.CASH || 0
          const holdings: Array<{symbol: string, quantity: number, value: number}> = []
          
          Object.entries(latestPosition?.positions || {}).forEach(([symbol, quantity]) => {
            if (symbol !== 'CASH' && quantity > 0) {
              // For demo purposes, use a simple price calculation
              const estimatedPrice = symbol.includes('.') ? 50 : 150 // CN vs US stocks
              const value = (quantity as number) * estimatedPrice
              totalValue += value
              holdings.push({
                symbol,
                quantity: quantity as number,
                value
              })
            }
          })

          agents.push({
            name: agentDir,
            totalValue,
            cash: latestPosition?.positions?.CASH || 0,
            holdings,
            lastUpdate: latestPosition?.date,
            totalTrades: positions.filter(p => p.this_action?.action !== 'no_trade').length
          })
        } catch (error) {
          console.error(`Error reading position file for ${agentDir}:`, error)
        }
      }
    }

    return NextResponse.json({
      agents,
      summary: {
        totalAgents: agents.length,
        totalValue: agents.reduce((sum, agent) => sum + agent.totalValue, 0),
        activeTrades: agents.reduce((sum, agent) => sum + agent.totalTrades, 0)
      }
    })
    
  } catch (error) {
    console.error('Portfolio API error:', error)
    return NextResponse.json({
      error: 'Failed to fetch portfolio data',
      message: 'An error occurred while reading trading data'
    }, { status: 500 })
  }
}