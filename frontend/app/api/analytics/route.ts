import { NextResponse } from 'next/server'
import { HKUDSIntegration } from '@/lib/hkuds-integration'

export async function GET() {
  try {
    const hkuds = new HKUDSIntegration()
    
    // Check if agent is initialized, if not, initialize it
    if (!(await hkuds.isInitialized())) {
      await hkuds.initializeMasterAgent()
      await hkuds.registerAgent()
    }
    
    // Get real performance metrics from HKUDS
    const metrics = await hkuds.getPerformanceMetrics()
    const portfolio = await hkuds.getCurrentPortfolio()
    
    return NextResponse.json({
      success: true,
      metrics: {
        totalReturn: metrics.cumulativeReturn,
        annualizedReturn: metrics.cumulativeReturn, // Can be enhanced with proper annualization
        sharpeRatio: metrics.sharpeRatio,
        maxDrawdown: metrics.maxDrawdown,
        volatility: metrics.volatility,
        winRate: metrics.winRate,
        profitLossRatio: metrics.profitLossRatio,
        tradingDays: metrics.totalTradingDays
      },
      portfolio: {
        totalValue: portfolio.totalValue,
        cash: portfolio.cash,
        positions: portfolio.positions,
        lastUpdated: portfolio.lastUpdated
      },
      performance: {
        daily: [], // Can be enhanced with daily returns
        monthly: [], // Can be enhanced with monthly performance
        quarterly: [] // Can be enhanced with quarterly breakdown
      }
    })
  } catch (error) {
    console.error('Analytics error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch analytics data',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const { action } = await request.json()
    const hkuds = new HKUDSIntegration()
    
    if (action === 'initialize') {
      await hkuds.initializeMasterAgent()
      await hkuds.registerAgent()
      
      return NextResponse.json({
        success: true,
        message: 'HKUDS Master Agent initialized successfully'
      })
    }
    
    return NextResponse.json({
      success: false,
      error: 'Invalid action'
    }, { status: 400 })
  } catch (error) {
    console.error('Analytics initialization error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to initialize analytics',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}