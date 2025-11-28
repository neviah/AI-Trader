'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Navbar from '@/components/Navbar'
import AuthGuard from '@/components/AuthGuard'
import Link from 'next/link'
import { ArrowLeft, Play, Pause, Settings, TrendingUp, Brain, PieChart, Activity, BarChart3 } from 'lucide-react'
import { ErrorBoundary, safeLocaleString, safeDate } from '../../components/ErrorBoundary'

interface MasterPortfolio {
  holdings: Array<{
    symbol: string
    weight?: number
    percentage?: number
    value?: number
    change?: number
    entryPrice?: number
    entryDate?: string
  }>
  cash?: number
  lastUpdated?: string
  totalUsers?: number
  aiDecisionId?: string
  totalValue?: number
  performanceToday?: number
  recentSales?: Array<{
    symbol: string
    salePrice: number
    saleDate: string
    profit?: number
  }>
}

interface AIDecision {
  symbol: string
  action: 'buy' | 'sell' | 'hold'
  reasoning: string
  confidence: number
  targetPrice?: number
  target_price?: number
  currentPrice?: number
  current_price?: number
  timestamp: string
}

interface PerformanceData {
  totalDecisions: number
  accuracy: number
  avgConfidence: number
  winRate: number
  recentPerformance: Array<{
    date: string
    decisions: number
    avgConfidence: number
    actions: {
      buy: number
      sell: number
      hold: number
    }
  }>
  actionDistribution: {
    buy: number
    sell: number
    hold: number
  }
}

interface GlobalAnalysis {
  success: boolean
  type: string
  timestamp: string
  aiDecisions: AIDecision[]
  masterPortfolio: MasterPortfolio
  affectedUsers: number
  paperTrading: boolean
}

export default function MasterAIPage() {
  const [loading, setLoading] = useState(false)
  const [performanceLoading, setPerformanceLoading] = useState(false)
  const [masterPortfolio, setMasterPortfolio] = useState<MasterPortfolio | null>(null)
  const [performanceData, setPerformanceData] = useState<PerformanceData | null>(null)
  const [recentAnalysis, setRecentAnalysis] = useState<GlobalAnalysis | null>(null)
  const [aiTradingActive, setAiTradingActive] = useState(true)
  const [showSuccessMessage, setShowSuccessMessage] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadAllData()
  }, [])

  const loadAllData = async () => {
    await Promise.all([
      loadPerformanceData(),
      loadMasterPortfolio()
    ])
  }

  const loadPerformanceData = async () => {
    try {
      setPerformanceLoading(true)
      const response = await fetch('https://ai-trader-backend-3nsl.onrender.com/api/performance')
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const result = await response.json()
      if (result.success) {
        setPerformanceData(result.performance)
      }
    } catch (error) {
      console.error('Failed to load performance data:', error)
      setError('Failed to load performance data')
    } finally {
      setPerformanceLoading(false)
    }
  }

  const loadMasterPortfolio = async () => {
    try {
      const response = await fetch('https://ai-trader-backend-3nsl.onrender.com/api/portfolio')
      if (response.ok) {
        const data = await response.json()
        setMasterPortfolio(data.masterPortfolio)
      }
    } catch (error) {
      console.error('Failed to load master portfolio:', error)
      setError('Failed to load portfolio data')
    }
  }

  const runGlobalAnalysis = async () => {
    setLoading(true)
    setShowSuccessMessage(false)
    setError(null)
    try {
      const response = await fetch('https://ai-trader-backend-3nsl.onrender.com/api/master-ai-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'analyze'
        })
      })

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`)
      }

      const result = await response.json()
      
      if (result.success) {
        setRecentAnalysis(result)
        setShowSuccessMessage(true)
        await loadMasterPortfolio() // Refresh portfolio
        await loadPerformanceData() // Refresh performance
      }
    } catch (error) {
      console.error('Analysis failed:', error)
      setError('Analysis failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        
        <div className="max-w-6xl mx-auto px-6 py-8">
          
          {/* Header */}
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="flex items-center justify-between mb-4">
              <Link href="/dashboard" className="flex items-center text-gray-600 hover:text-gray-900 transition-colors">
                <ArrowLeft className="w-5 h-5 mr-2" />
                Back to Dashboard
              </Link>
              
              <div className="flex items-center space-x-4">
                <div className="flex items-center">
                  <div className={`w-3 h-3 rounded-full mr-2 ${aiTradingActive ? 'bg-green-500' : 'bg-red-500'}`}></div>
                  <span className="text-sm text-gray-600">
                    AI Trading {aiTradingActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <button
                  onClick={() => setAiTradingActive(!aiTradingActive)}
                  className={`px-4 py-2 rounded-lg flex items-center space-x-2 ${
                    aiTradingActive 
                      ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                      : 'bg-green-100 text-green-700 hover:bg-green-200'
                  }`}
                >
                  {aiTradingActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  <span>{aiTradingActive ? 'Pause' : 'Start'} AI</span>
                </button>
              </div>
            </div>
            
            <h1 className="text-3xl font-bold text-gray-900">Master AI Trading System</h1>
            <p className="text-gray-600 mt-2">AI-driven portfolio management and trading decisions</p>
          </motion.div>

          {error && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mb-6 p-4 bg-red-100 text-red-700 rounded-lg"
            >
              {error}
            </motion.div>
          )}

          {/* Section 1: AI Performance Track Record */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-8"
          >
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
              <BarChart3 className="w-6 h-6 mr-3 text-blue-600" />
              AI Performance Track Record
            </h2>
            
            {performanceLoading ? (
              <div className="bg-white rounded-xl shadow-sm border p-8">
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <span className="ml-3 text-gray-600">Loading performance data...</span>
                </div>
              </div>
            ) : performanceData ? (
              <div className="grid md:grid-cols-4 gap-6 mb-6">
                <div className="bg-white rounded-xl shadow-sm border p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Decisions</p>
                      <p className="text-2xl font-bold text-gray-900">{performanceData.totalDecisions}</p>
                    </div>
                    <Brain className="w-8 h-8 text-blue-600" />
                  </div>
                </div>
                
                <div className="bg-white rounded-xl shadow-sm border p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Win Rate</p>
                      <p className="text-2xl font-bold text-green-600">{(performanceData.winRate * 100).toFixed(1)}%</p>
                    </div>
                    <TrendingUp className="w-8 h-8 text-green-600" />
                  </div>
                </div>
                
                <div className="bg-white rounded-xl shadow-sm border p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Accuracy</p>
                      <p className="text-2xl font-bold text-blue-600">{(performanceData.accuracy * 100).toFixed(1)}%</p>
                    </div>
                    <PieChart className="w-8 h-8 text-blue-600" />
                  </div>
                </div>
                
                <div className="bg-white rounded-xl shadow-sm border p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Avg Confidence</p>
                      <p className="text-2xl font-bold text-purple-600">{(performanceData.avgConfidence * 100).toFixed(1)}%</p>
                    </div>
                    <Settings className="w-8 h-8 text-purple-600" />
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-sm border p-8 text-center">
                <p className="text-gray-500">No performance data available</p>
              </div>
            )}
          </motion.div>

          {/* Section 2: Current Holdings & Recent Sales */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-8"
          >
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
              <PieChart className="w-6 h-6 mr-3 text-green-600" />
              Portfolio Holdings & Recent Activity
            </h2>
            
            <div className="grid md:grid-cols-2 gap-6">
              {/* Current Holdings */}
              <div className="bg-white rounded-xl shadow-sm border p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Current Holdings</h3>
                {masterPortfolio?.holdings && masterPortfolio.holdings.length > 0 ? (
                  <div className="space-y-4">
                    {masterPortfolio.holdings.map((holding, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-semibold text-gray-900">{holding.symbol}</p>
                          <p className="text-sm text-gray-600">
                            {holding.percentage ? `${holding.percentage.toFixed(1)}%` : 'N/A'} of portfolio
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-gray-900">
                            ${holding.value ? holding.value.toLocaleString() : 'N/A'}
                          </p>
                          <p className={`text-sm ${(holding.change || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {(holding.change || 0) >= 0 ? '+' : ''}{(holding.change || 0).toFixed(2)}%
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-8">No current holdings</p>
                )}
              </div>

              {/* Recent Sales */}
              <div className="bg-white rounded-xl shadow-sm border p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Sales</h3>
                {masterPortfolio?.recentSales && masterPortfolio.recentSales.length > 0 ? (
                  <div className="space-y-4">
                    {masterPortfolio.recentSales.map((sale, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-semibold text-gray-900">{sale.symbol}</p>
                          <p className="text-sm text-gray-600">
                            {safeDate(sale.saleDate)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-gray-900">
                            ${sale.salePrice.toLocaleString()}
                          </p>
                          <p className={`text-sm ${(sale.profit || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {(sale.profit || 0) >= 0 ? '+' : ''}${(sale.profit || 0).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-8">No recent sales</p>
                )}
              </div>
            </div>
          </motion.div>

          {/* Section 3: AI Activity Log */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mb-8"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                <Activity className="w-6 h-6 mr-3 text-orange-600" />
                AI Decision Activity Log
              </h2>
              
              <button
                onClick={runGlobalAnalysis}
                disabled={loading || !aiTradingActive}
                className={`px-6 py-3 rounded-lg font-medium flex items-center space-x-2 ${
                  loading || !aiTradingActive
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Analyzing...</span>
                  </>
                ) : (
                  <>
                    <Brain className="w-4 h-4" />
                    <span>Run Analysis</span>
                  </>
                )}
              </button>
            </div>

            {showSuccessMessage && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="mb-6 p-4 bg-green-100 text-green-700 rounded-lg flex items-center"
              >
                <TrendingUp className="w-5 h-5 mr-2" />
                Analysis completed successfully! Portfolio updated.
              </motion.div>
            )}

            <div className="bg-white rounded-xl shadow-sm border p-6">
              {recentAnalysis?.aiDecisions && recentAnalysis.aiDecisions.length > 0 ? (
                <div className="space-y-6">
                  {recentAnalysis.aiDecisions.map((decision, index) => (
                    <div key={index} className="border-l-4 border-blue-500 pl-6 py-4">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h4 className="font-semibold text-gray-900 text-lg">{decision.symbol}</h4>
                          <div className="flex items-center space-x-4 text-sm text-gray-600">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              decision.action === 'buy' ? 'bg-green-100 text-green-800' :
                              decision.action === 'sell' ? 'bg-red-100 text-red-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {decision.action.toUpperCase()}
                            </span>
                            <span>Confidence: {(decision.confidence * 100).toFixed(1)}%</span>
                            <span>{safeDate(decision.timestamp)}</span>
                          </div>
                        </div>
                        <div className="text-right text-sm text-gray-600">
                          <p>Target: ${(decision.targetPrice || decision.target_price || 0).toFixed(2)}</p>
                          <p>Current: ${(decision.currentPrice || decision.current_price || 0).toFixed(2)}</p>
                        </div>
                      </div>
                      <p className="text-gray-700 leading-relaxed">{decision.reasoning}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Brain className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 text-lg">No recent AI decisions</p>
                  <p className="text-gray-400 text-sm mt-2">Run an analysis to see AI trading decisions</p>
                </div>
              )}
            </div>
          </motion.div>

        </div>
      </div>
    </AuthGuard>
  )
}