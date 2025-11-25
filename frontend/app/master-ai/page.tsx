'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Navbar from '@/components/Navbar'
import AuthGuard from '@/components/AuthGuard'
import Link from 'next/link'
import { ArrowLeft, Play, Pause, Settings, TrendingUp, Brain } from 'lucide-react'
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
  const [masterPortfolio, setMasterPortfolio] = useState<MasterPortfolio | null>(null)
  const [recentAnalysis, setRecentAnalysis] = useState<GlobalAnalysis | null>(null)
  const [aiTradingActive, setAiTradingActive] = useState(true) // AI should be active by default
  const [showSuccessMessage, setShowSuccessMessage] = useState(false)
  const [userFunds, setUserFunds] = useState(15000) // Mock user balance

  useEffect(() => {
    loadMasterPortfolio()
  }, [])

  const loadMasterPortfolio = async () => {
    try {
      const response = await fetch('/api/master-ai-supabase')
      if (response.ok) {
        const data = await response.json()
        setMasterPortfolio(data.masterPortfolio)
      }
    } catch (error) {
      console.error('Failed to load master portfolio:', error)
    }
  }

  const runGlobalAnalysis = async () => {
    setLoading(true)
    setShowSuccessMessage(false)
    try {
      const response = await fetch('/api/master-ai-supabase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'analyze'
        })
      })

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`)
      }

      const data = await response.json()
      setRecentAnalysis(data)
      setMasterPortfolio(data.masterPortfolio)
      
      // Show success message
      setShowSuccessMessage(true)
      
      // Scroll to results section after analysis completes
      setTimeout(() => {
        const resultsSection = document.getElementById('analysis-results')
        if (resultsSection) {
          resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }
      }, 300)
      
      // Hide success message after 3 seconds
      setTimeout(() => {
        setShowSuccessMessage(false)
      }, 3000)
      
    } catch (error) {
      console.error('Global analysis failed:', error)
      alert('AI Analysis failed. Check console for details.')
    } finally {
      setLoading(false)
    }
  }

  const toggleAITrading = async () => {
    try {
      setAiTradingActive(!aiTradingActive)
      // In real app, this would call API to pause/resume AI trading
      alert(aiTradingActive ? 'AI Trading paused for your account' : 'AI Trading resumed for your account')
    } catch (error) {
      console.error('Failed to toggle AI trading:', error)
    }
  }

  const startAIOnboarding = async () => {
    if (userFunds < 100) {
      alert('Please add funds to your wallet first (minimum $100)')
      return
    }
    
    try {
      const response = await fetch('/api/master-ai-supabase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'onboard',
          userId: 'user-' + Date.now(),
          initialInvestment: userFunds
        })
      })

      if (response.ok) {
        const data = await response.json()
        setAiTradingActive(true)
        alert(`✅ AI Trading started! Your $${(userFunds || 0).toLocaleString()} has been allocated across ${data?.userPortfolio?.portfolio?.length || 0} AI-selected stocks.`)
        console.log('User portfolio:', data.userPortfolio)
      }
    } catch (error) {
      console.error('Onboarding failed:', error)
    }
  }

  const getActionColor = (action: string) => {
    switch (action) {
      case 'buy': return 'text-green-600 bg-green-100'
      case 'sell': return 'text-red-600 bg-red-100'
      case 'hold': return 'text-yellow-600 bg-yellow-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getConfidenceBar = (confidence: number) => {
    const width = confidence * 100
    const color = confidence > 0.7 ? 'bg-green-500' : confidence > 0.5 ? 'bg-yellow-500' : 'bg-red-500'
    return (
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div className={`h-2 rounded-full ${color}`} style={{ width: `${width}%` }}></div>
      </div>
    )
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        
        <div className="max-w-6xl mx-auto px-6 py-8">
          
          {/* Header with Back Navigation */}
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="flex items-center justify-between mb-4">
              <Link href="/dashboard" className="flex items-center text-gray-600 hover:text-gray-900 transition-colors">
                <ArrowLeft size={20} className="mr-2" />
                Back to Dashboard
              </Link>
              
              <div className="flex items-center space-x-2">
                <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                  aiTradingActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                }`}>
                  {aiTradingActive ? 'AI Trading Active' : 'AI Trading Paused'}
                </div>
              </div>
            </div>
            
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              🧠 Master AI Trading Engine
            </h1>
            <p className="text-gray-600">
              One AI brain making decisions for all {masterPortfolio?.totalUsers || 1200}+ users
            </p>
          </motion.div>

        {/* Current Master Portfolio */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-600 rounded-xl p-6 mb-6 shadow-xl"
        >
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-white">Current AI Portfolio</h2>
            <div className="text-right">
              <p className="text-slate-300 text-sm font-medium">Synchronized across all users</p>
              <p className="text-emerald-400 text-lg font-bold">{(masterPortfolio?.totalUsers || 1200).toLocaleString()} users</p>
            </div>
          </div>
            
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
            {(masterPortfolio?.holdings || [
              { symbol: 'AAPL', percentage: 15, value: 7500000, change: 2.1 },
              { symbol: 'GOOGL', percentage: 12, value: 6000000, change: 1.8 },
              { symbol: 'MSFT', percentage: 10, value: 5000000, change: -0.5 },
              { symbol: 'NVDA', percentage: 8, value: 4000000, change: 3.2 },
              { symbol: 'TSLA', percentage: 7, value: 3500000, change: 4.5 }
            ]).map((holding, index) => (
              <div key={index} className="bg-slate-700 border border-slate-500 rounded-lg p-4 text-center hover:bg-slate-600 transition-colors">
                <h3 className="font-bold text-white text-xl mb-1">{holding.symbol}</h3>
                <p className="text-slate-200 text-sm font-medium">{((holding?.weight || holding?.percentage || 0) * (holding?.weight ? 100 : 1)).toFixed(1)}% weight</p>
                <p className="text-emerald-400 text-lg font-bold">${holding?.value?.toLocaleString() || holding?.entryPrice || 'N/A'}</p>
                <p className="text-slate-300 text-sm">{holding?.entryDate ? `Entry: ${new Date(holding.entryDate).toLocaleDateString()}` : `Change: ${(holding?.change || 0).toFixed(1)}%`}</p>
              </div>
            ))}
            <div className="bg-blue-700 border border-blue-500 rounded-lg p-4 text-center hover:bg-blue-600 transition-colors">
              <h3 className="font-bold text-white text-xl mb-1">CASH</h3>
              <p className="text-blue-100 text-sm font-medium">5.0%</p>
              <p className="text-blue-200 text-lg font-bold">Reserve</p>
              <p className="text-blue-300 text-sm">Liquidity</p>
            </div>
          </div>

          <div className="border-t border-slate-600 pt-4 text-center">
            <p className="text-slate-200 text-sm font-medium">
              Last AI decision: {new Date(masterPortfolio?.lastUpdated || Date.now()).toLocaleString()}
            </p>
            <p className="text-slate-400 text-xs">ID: {masterPortfolio?.aiDecisionId || 'ai-decision-' + Date.now()}</p>
          </div>
        </motion.div>

          {/* AI Trading Controls */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-lg shadow-sm border p-6 mb-6"
          >
            <h2 className="text-xl font-semibold text-gray-900 mb-4">AI Trading Controls</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              
              {!aiTradingActive ? (
                <button
                  onClick={startAIOnboarding}
                  disabled={userFunds < 100}
                  className={`py-4 rounded-lg font-semibold text-lg transition-all flex items-center justify-center ${
                    userFunds < 100
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-gradient-to-r from-green-600 to-blue-600 text-white hover:from-green-700 hover:to-blue-700 shadow-lg hover:shadow-xl'
                  }`}
                >
                  <Play size={20} className="mr-2" />
                  Start AI Trading (${(userFunds || 0).toLocaleString()})
                </button>
              ) : (
                <button
                  onClick={toggleAITrading}
                  className="py-4 rounded-lg font-semibold text-lg bg-gradient-to-r from-yellow-600 to-orange-600 text-white hover:from-yellow-700 hover:to-orange-700 shadow-lg hover:shadow-xl transition-all flex items-center justify-center"
                >
                  <Pause size={20} className="mr-2" />
                  Pause AI Trading
                </button>
              )}

              <button
                onClick={runGlobalAnalysis}
                disabled={loading}
                className={`py-4 rounded-lg font-semibold text-lg transition-all flex items-center justify-center ${
                  loading
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:from-purple-700 hover:to-blue-700 shadow-lg hover:shadow-xl'
                }`}
              >
                {loading ? (
                  <>
                    <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                    AI Analyzing...
                  </>
                ) : (
                  <>
                    <TrendingUp size={20} className="mr-2" />
                    Run Market Analysis
                  </>
                )}
              </button>

              {/* Success Message */}
              {showSuccessMessage && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="mt-4 p-4 bg-green-500/20 border border-green-400/50 rounded-lg text-green-300 text-center"
                >
                  ✅ Analysis complete! Check results below ⬇️
                </motion.div>
              )}

              <Link href="/portfolio">
                <button className="w-full py-4 rounded-lg font-semibold text-lg bg-gradient-to-r from-gray-600 to-gray-700 text-white hover:from-gray-700 hover:to-gray-800 shadow-lg hover:shadow-xl transition-all flex items-center justify-center">
                  <Settings size={20} className="mr-2" />
                  View Portfolio
                </button>
              </Link>
            </div>

            {userFunds < 100 && (
              <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-yellow-800 text-sm">
                  <strong>Add funds to start:</strong> You need at least $100 to begin AI trading. 
                  <Link href="/wallet" className="text-yellow-900 underline hover:text-yellow-700 ml-1">
                    Add funds to your wallet →
                  </Link>
                </p>
              </div>
            )}

            <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="text-blue-900 font-medium mb-2">🤖 How Master AI Works:</h3>
              <ul className="text-blue-800 text-sm space-y-1">
                <li>• AI continuously monitors global markets, news, and economic indicators</li>
                <li>• Makes centralized buy/sell decisions affecting all {masterPortfolio?.totalUsers || 1200}+ users</li>
                <li>• Your funds are automatically allocated to AI-selected stocks</li>
                <li>• When AI sells, your positions sell automatically too</li>
                <li>• You can pause/resume AI trading anytime</li>
              </ul>
            </div>
          </motion.div>

        {/* Recent AI Analysis */}
        {recentAnalysis && (
          <motion.div 
            id="analysis-results"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-gradient-to-br from-emerald-900 to-teal-900 border-2 border-emerald-400 rounded-xl p-6 shadow-xl shadow-emerald-400/30"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">Latest AI Global Analysis</h2>
              <span className="px-4 py-2 bg-emerald-500 text-white text-sm font-bold rounded-full animate-pulse shadow-lg">
                🎯 NEW RESULTS
              </span>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-slate-700 border border-emerald-400 rounded-lg p-4 text-center">
                <div className="text-3xl font-bold text-emerald-400">
                  {recentAnalysis?.aiDecisions?.filter(d => d.action === 'buy').length || 0}
                </div>
                <div className="text-sm font-medium text-emerald-200">Buy Signals</div>
              </div>
              <div className="bg-slate-700 border border-red-400 rounded-lg p-4 text-center">
                <div className="text-3xl font-bold text-red-400">
                  {recentAnalysis?.aiDecisions?.filter(d => d.action === 'sell').length || 0}
                </div>
                <div className="text-sm font-medium text-red-200">Sell Signals</div>
              </div>
              <div className="bg-slate-700 border border-yellow-400 rounded-lg p-4 text-center">
                <div className="text-3xl font-bold text-yellow-400">
                  {recentAnalysis?.aiDecisions?.filter(d => d.action === 'hold').length || 0}
                </div>
                <div className="text-sm font-medium text-yellow-200">Hold Signals</div>
              </div>
              <div className="bg-slate-700 border border-purple-400 rounded-lg p-4 text-center">
                <div className="text-3xl font-bold text-purple-400">
                  {(recentAnalysis?.affectedUsers || 1200).toLocaleString()}
                </div>
                <div className="text-sm font-medium text-purple-200">Users Affected</div>
              </div>
            </div>

            <div className="space-y-4">
              {(recentAnalysis?.aiDecisions || []).map((decision, index) => (
                <motion.div
                  key={decision.symbol}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-slate-700 border border-slate-500 rounded-lg p-4 hover:bg-slate-600 transition-colors"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-3">
                      <h3 className="font-bold text-white text-xl">{decision.symbol}</h3>
                      <span className={`px-3 py-1 rounded-lg font-bold ${getActionColor(decision.action)}`}>
                        {decision.action.toUpperCase()}
                      </span>
                    </div>
                    <div className="text-right">
                      <p className="text-white font-bold text-lg">${(decision?.currentPrice || decision?.current_price || 0).toFixed(2)}</p>
                      <p className="text-slate-300 text-sm font-medium">Target: ${(decision?.targetPrice || decision?.target_price || 0).toFixed(2)}</p>
                    </div>
                  </div>
                  
                  <div className="mb-3">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-slate-200 text-sm font-medium">AI Confidence</span>
                      <span className="text-white font-bold">{((decision?.confidence || 0) * 100).toFixed(1)}%</span>
                    </div>
                    {getConfidenceBar(decision.confidence)}
                  </div>
                  
                  <p className="text-slate-200 text-sm">{decision.reasoning}</p>
                </motion.div>
              ))}
            </div>

            <div className="mt-6 text-center text-gray-400 text-sm border-t border-white/10 pt-4">
              <p>Global analysis completed at {new Date(recentAnalysis?.timestamp || Date.now()).toLocaleString()}</p>
              <p className="text-yellow-400">
                These decisions will affect all {(recentAnalysis?.affectedUsers || 1200).toLocaleString()} platform users
                {recentAnalysis?.paperTrading && ' • Paper Trading Mode'}
              </p>
            </div>
          </motion.div>
        )}

      </div>
    </div>
    </AuthGuard>
  )
}