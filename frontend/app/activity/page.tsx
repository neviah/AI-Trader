'use client'

import { useState, useEffect } from 'react'
import { Activity, TrendingUp, TrendingDown, Clock, DollarSign, BarChart3 } from 'lucide-react'
import Navbar from '@/components/Navbar'

interface TradeActivity {
  id: string
  timestamp: string
  action: 'buy' | 'sell'
  symbol: string
  quantity: number
  price: number
  value: number
  reasoning: string
  profit?: number
}

interface AgentMetrics {
  totalTrades: number
  successRate: number
  avgHoldTime: string
  totalProfit: number
  winRate: number
  activePositions: number
}

export default function ActivityPage() {
  const [activities, setActivities] = useState<TradeActivity[]>([
    {
      id: '1',
      timestamp: '2025-11-17 14:30:15',
      action: 'buy',
      symbol: 'NVDA',
      quantity: 10,
      price: 485.20,
      value: 4852.00,
      reasoning: 'Strong AI sector momentum and positive earnings outlook. RSI indicates oversold conditions.',
    },
    {
      id: '2',
      timestamp: '2025-11-17 13:45:22',
      action: 'sell',
      symbol: 'TSLA',
      quantity: 15,
      price: 242.65,
      value: 3639.75,
      reasoning: 'Taking profits after 12% gain. Technical indicators suggest resistance at current levels.',
      profit: 420.50
    },
    {
      id: '3',
      timestamp: '2025-11-17 12:20:08',
      action: 'buy',
      symbol: 'AAPL',
      quantity: 25,
      price: 185.20,
      value: 4630.00,
      reasoning: 'Apple showing strong support at $185 level. Institutional buying detected.',
    },
    {
      id: '4',
      timestamp: '2025-11-17 11:15:33',
      action: 'sell',
      symbol: 'MSFT',
      quantity: 8,
      price: 378.50,
      value: 3028.00,
      reasoning: 'Risk management: Position size exceeded 15% of portfolio. Partial profit taking.',
      profit: 156.80
    },
  ])

  const [metrics, setMetrics] = useState<AgentMetrics>({
    totalTrades: 47,
    successRate: 73.4,
    avgHoldTime: '3.2 days',
    totalProfit: 1247.85,
    winRate: 68.1,
    activePositions: 12
  })

  const [selectedTimeRange, setSelectedTimeRange] = useState<'1D' | '1W' | '1M'>('1D')

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(value)
  }

  const formatDateTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleString()
  }

  const getActionColor = (action: string) => {
    return action === 'buy' ? 'text-green-600 bg-green-50' : 'text-red-600 bg-red-50'
  }

  const getActionIcon = (action: string) => {
    return action === 'buy' ? <TrendingUp size={16} /> : <TrendingDown size={16} />
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <main className="container mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Agent Activity</h1>
          <p className="text-gray-600 mt-2">Real-time AI trading decisions and performance metrics</p>
        </div>

        {/* Agent Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow-md p-4">
            <div className="flex items-center">
              <BarChart3 size={20} className="text-blue-600 mr-2" />
              <div>
                <p className="text-xs font-medium text-gray-500">Total Trades</p>
                <p className="text-xl font-bold text-gray-900">{metrics.totalTrades}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-4">
            <div className="flex items-center">
              <TrendingUp size={20} className="text-green-600 mr-2" />
              <div>
                <p className="text-xs font-medium text-gray-500">Success Rate</p>
                <p className="text-xl font-bold text-green-600">{metrics.successRate}%</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-4">
            <div className="flex items-center">
              <Clock size={20} className="text-purple-600 mr-2" />
              <div>
                <p className="text-xs font-medium text-gray-500">Avg Hold</p>
                <p className="text-lg font-bold text-gray-900">{metrics.avgHoldTime}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-4">
            <div className="flex items-center">
              <DollarSign size={20} className="text-green-600 mr-2" />
              <div>
                <p className="text-xs font-medium text-gray-500">Total Profit</p>
                <p className="text-lg font-bold text-green-600">{formatCurrency(metrics.totalProfit)}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-4">
            <div className="flex items-center">
              <Activity size={20} className="text-blue-600 mr-2" />
              <div>
                <p className="text-xs font-medium text-gray-500">Win Rate</p>
                <p className="text-xl font-bold text-blue-600">{metrics.winRate}%</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-4">
            <div className="flex items-center">
              <BarChart3 size={20} className="text-orange-600 mr-2" />
              <div>
                <p className="text-xs font-medium text-gray-500">Positions</p>
                <p className="text-xl font-bold text-gray-900">{metrics.activePositions}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Recent Trading Activity</h3>
            <div className="flex space-x-2">
              {['1D', '1W', '1M'].map((range) => (
                <button
                  key={range}
                  onClick={() => setSelectedTimeRange(range as any)}
                  className={`px-3 py-1 text-sm rounded-md ${
                    selectedTimeRange === range
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  {range}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            {activities.map((activity) => (
              <div key={activity.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4">
                    <div className={`p-2 rounded-full ${getActionColor(activity.action)}`}>
                      {getActionIcon(activity.action)}
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getActionColor(activity.action)}`}>
                          {activity.action.toUpperCase()}
                        </span>
                        <span className="font-bold text-gray-900">{activity.symbol}</span>
                        <span className="text-gray-600">×{activity.quantity}</span>
                        <span className="text-gray-600">@{formatCurrency(activity.price)}</span>
                      </div>
                      
                      <p className="text-sm text-gray-600 mb-2">{activity.reasoning}</p>
                      
                      <div className="flex items-center space-x-4 text-xs text-gray-500">
                        <span>{formatDateTime(activity.timestamp)}</span>
                        <span>Total: {formatCurrency(activity.value)}</span>
                        {activity.profit && (
                          <span className="text-green-600 font-medium">
                            Profit: +{formatCurrency(activity.profit)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 text-center">
            <button className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md">
              Load More Activities
            </button>
          </div>
        </div>

        {/* AI Insights */}
        <div className="mt-8 bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-6">
          <h3 className="text-purple-900 font-semibold mb-3">🧠 AI Agent Insights</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-purple-800 mb-2">Current Strategy</h4>
              <ul className="text-sm text-purple-700 space-y-1">
                <li>• Momentum-based trading with risk management</li>
                <li>• Focus on large-cap technology stocks</li>
                <li>• Average position size: 8% of portfolio</li>
                <li>• Stop-loss set at 5% for all positions</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-purple-800 mb-2">Recent Patterns</h4>
              <ul className="text-sm text-purple-700 space-y-1">
                <li>• Increased activity in AI/tech sector</li>
                <li>• Shorter holding periods (2-4 days)</li>
                <li>• Higher success rate on morning trades</li>
                <li>• Risk-off approach during market uncertainty</li>
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}