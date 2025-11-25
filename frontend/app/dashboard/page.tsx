'use client'

import { useEffect, useState } from 'react'
import AuthGuard from '@/components/AuthGuard'
import Navbar from '@/components/Navbar'
import { TrendingUp, DollarSign, Activity, Target, Bot, Users, Brain, Zap } from 'lucide-react'
import Link from 'next/link'

interface UserPosition {
  symbol: string
  shares: number
  entryPrice: number
  currentPrice: number
  marketValue: number
  unrealizedPnl: number
  pnlPercent: number
  aiManaged: boolean
}

interface UserPortfolio {
  userId: string
  positions: UserPosition[]
  cash: number
  totalMarketValue: number
  totalPnl: number
  totalPnlPercent: number
  syncedWithAI: boolean
  lastAIUpdate: string
}

export default function DashboardPage() {
  const [portfolio, setPortfolio] = useState<UserPortfolio | null>(null)
  const [loading, setLoading] = useState(true)
  const [platformStats, setPlatformStats] = useState<any>(null)
  const [recentActivity, setRecentActivity] = useState<any[]>([])

  useEffect(() => {
    loadUserPortfolio()
  }, [])

  const loadUserPortfolio = async () => {
    try {
      const response = await fetch('/api/user-portfolio?userId=user-demo')
      if (response.ok) {
        const data = await response.json()
        setPortfolio(data.portfolio)
        setPlatformStats(data.platformStats)
        setRecentActivity(data.recentAIActivity)
      }
    } catch (error) {
      console.error('Failed to load portfolio:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Trading Dashboard</h1>
            <p className="text-gray-600 mt-2">Monitor your AI-powered trading performance</p>
          </div>

          {/* AI-Managed Portfolio Status */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border-2 border-blue-200 mb-8">
            <div className="p-6 border-b border-blue-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Brain className="text-purple-600 mr-3" size={32} />
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">AI-Managed Portfolio</h2>
                    <p className="text-gray-600">
                      {loading ? 'Loading...' : portfolio?.syncedWithAI ? 'Synchronized with Master AI' : 'Manual portfolio'}
                    </p>
                  </div>
                </div>
                <div className="flex space-x-3">
                  <Link href="/master-ai">
                    <button className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors">
                      <Brain size={16} className="mr-2" />
                      View Master AI
                    </button>
                  </Link>
                  <div className="flex items-center px-3 py-2 bg-green-100 text-green-700 rounded-md">
                    <Zap size={16} className="mr-2" />
                    Auto-Trading
                  </div>
                </div>
              </div>
            </div>
            
            {portfolio && (
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-600">${portfolio.totalMarketValue.toLocaleString()}</p>
                    <p className="text-sm text-gray-600">Total Value</p>
                  </div>
                  <div className="text-center">
                    <p className={`text-2xl font-bold ${portfolio.totalPnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      ${portfolio.totalPnl.toLocaleString()}
                    </p>
                    <p className="text-sm text-gray-600">P&L</p>
                  </div>
                  <div className="text-center">
                    <p className={`text-2xl font-bold ${portfolio.totalPnlPercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {portfolio.totalPnlPercent >= 0 ? '+' : ''}{portfolio.totalPnlPercent.toFixed(1)}%
                    </p>
                    <p className="text-sm text-gray-600">Return</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-purple-600">{portfolio.positions.length}</p>
                    <p className="text-sm text-gray-600">AI Positions</p>
                  </div>
                </div>
                
                <div className="mt-4 text-center text-sm text-gray-600">
                  Last AI update: {new Date(portfolio.lastAIUpdate).toLocaleString()}
                </div>
              </div>
            )}
          </div>

          {/* Platform Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Platform Users</p>
                  <p className="text-2xl font-bold text-gray-900">{platformStats?.totalUsers.toLocaleString() || '1,247'}</p>
                  <p className="text-sm text-blue-600">AI-managed</p>
                </div>
                <Users className="text-blue-600" size={32} />
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Assets Under Management</p>
                  <p className="text-2xl font-bold text-gray-900">${platformStats?.totalAUM ? (platformStats.totalAUM / 1000000).toFixed(1) + 'M' : '$45.6M'}</p>
                  <p className="text-sm text-green-600">Growing</p>
                </div>
                <DollarSign className="text-green-600" size={32} />
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">AI Uptime</p>
                  <p className="text-2xl font-bold text-gray-900">{platformStats?.aiUptime || '99.8'}%</p>
                  <p className="text-sm text-green-600">Operational</p>
                </div>
                <Activity className="text-green-600" size={32} />
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Avg Return</p>
                  <p className="text-2xl font-bold text-gray-900">+{platformStats?.avgReturn || '12.4'}%</p>
                  <p className="text-sm text-green-600">This year</p>
                </div>
                <Target className="text-green-600" size={32} />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Your AI-Synced Positions */}
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="p-6 border-b">
                <h2 className="text-xl font-semibold text-gray-900">Your AI-Managed Positions</h2>
                <p className="text-sm text-gray-600">Automatically synchronized with Master AI</p>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {portfolio?.positions.map((position, i) => (
                    <div key={i} className="flex items-center justify-between py-3 border-b last:border-b-0">
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-2">
                          <div className="px-2 py-1 text-xs font-medium rounded bg-purple-100 text-purple-700">
                            AI
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{position.symbol}</p>
                            <p className="text-sm text-gray-600">{position.shares} shares @ ${position.currentPrice.toFixed(2)}</p>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`text-sm font-medium ${
                          position.unrealizedPnl >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {position.unrealizedPnl >= 0 ? '+' : ''}${position.unrealizedPnl.toFixed(0)}
                        </p>
                        <p className={`text-xs ${
                          position.pnlPercent >= 0 ? 'text-green-500' : 'text-red-500'
                        }`}>
                          {position.pnlPercent >= 0 ? '+' : ''}{position.pnlPercent.toFixed(1)}%
                        </p>
                      </div>
                    </div>
                  )) || (
                    <div className="text-center text-gray-500 py-8">
                      <Brain size={48} className="mx-auto mb-2 opacity-50" />
                      <p>Loading AI-managed positions...</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Recent AI Decisions */}
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="p-6 border-b">
                <h2 className="text-xl font-semibold text-gray-900">Recent AI Decisions</h2>
                <p className="text-sm text-gray-600">Affecting all platform users</p>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {recentActivity.map((activity, i) => (
                    <div key={i} className="py-3 border-b last:border-b-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <div className={`px-2 py-1 text-xs font-medium rounded ${
                              activity.action === 'BUY' ? 'bg-green-100 text-green-700' :
                              activity.action === 'SELL' ? 'bg-red-100 text-red-700' :
                              'bg-blue-100 text-blue-700'
                            }`}>
                              {activity.action}
                            </div>
                            {activity.symbol && (
                              <span className="font-medium text-gray-900">{activity.symbol}</span>
                            )}
                          </div>
                          <p className="text-sm text-gray-900 mb-1">{activity.description}</p>
                          <p className="text-xs text-gray-500">{activity.reasoning}</p>
                        </div>
                        <div className="text-right ml-4">
                          <p className="text-xs text-gray-500">
                            {new Date(activity.timestamp).toLocaleTimeString()}
                          </p>
                          <p className="text-xs text-blue-600">
                            {activity.affectedUsers.toLocaleString()} users
                          </p>
                        </div>
                      </div>
                    </div>
                  )) || (
                    <div className="text-center text-gray-500 py-8">
                      <Activity size={48} className="mx-auto mb-2 opacity-50" />
                      <p>Loading recent AI activity...</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AuthGuard>
  )
}