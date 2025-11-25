'use client'

import { useState, useEffect } from 'react'
import { TrendingUp, TrendingDown, DollarSign, Activity, Play, Pause } from 'lucide-react'
import Navbar from '@/components/Navbar'
import { tradingAPI } from '@/lib/trading-api'

interface UserPortfolio {
  totalValue: number
  cash: number
  investments: number
  totalReturn: number
  returnPercentage: number
  agentActive: boolean
  riskLevel: 'low' | 'medium' | 'high'
}

interface Holding {
  symbol: string
  name: string
  quantity: number
  currentPrice: number
  value: number
  return: number
  returnPercentage: number
}

export default function PortfolioPage() {
  const [portfolio, setPortfolio] = useState<UserPortfolio>({
    totalValue: 10000,
    cash: 2500,
    investments: 7500,
    totalReturn: 750,
    returnPercentage: 8.5,
    agentActive: true,
    riskLevel: 'medium'
  })

  const [holdings, setHoldings] = useState<Holding[]>([
    { symbol: 'AAPL', name: 'Apple Inc.', quantity: 25, currentPrice: 185.20, value: 4630, return: 320, returnPercentage: 7.4 },
    { symbol: 'MSFT', name: 'Microsoft Corp.', quantity: 15, currentPrice: 378.50, value: 5677.50, return: 430, returnPercentage: 8.2 },
    { symbol: 'GOOGL', name: 'Alphabet Inc.', quantity: 8, currentPrice: 142.30, value: 1138.40, return: -45, returnPercentage: -3.8 },
  ])

  const [loading, setLoading] = useState(false)

  const toggleAgent = async () => {
    setLoading(true)
    try {
      // TODO: Call API to start/stop trading agent
      await new Promise(resolve => setTimeout(resolve, 1000))
      setPortfolio(prev => ({ ...prev, agentActive: !prev.agentActive }))
    } catch (error) {
      console.error('Failed to toggle agent:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(value)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <main className="container mx-auto px-6 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Your Portfolio</h1>
            <p className="text-gray-600 mt-2">AI-powered trading for your financial goals</p>
          </div>
          
          <button
            onClick={toggleAgent}
            disabled={loading}
            className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-medium transition-colors ${
              portfolio.agentActive
                ? 'bg-red-600 hover:bg-red-700 text-white'
                : 'bg-green-600 hover:bg-green-700 text-white'
            } disabled:opacity-50`}
          >
            {loading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            ) : portfolio.agentActive ? (
              <Pause size={20} />
            ) : (
              <Play size={20} />
            )}
            <span>{portfolio.agentActive ? 'Pause Trading' : 'Start Trading'}</span>
          </button>
        </div>

        {/* Portfolio Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-blue-100 text-blue-600 mr-4">
                <DollarSign size={24} />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Total Value</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(portfolio.totalValue)}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className={`p-3 rounded-full mr-4 ${
                portfolio.totalReturn >= 0 
                  ? 'bg-green-100 text-green-600' 
                  : 'bg-red-100 text-red-600'
              }`}>
                {portfolio.totalReturn >= 0 ? <TrendingUp size={24} /> : <TrendingDown size={24} />}
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Total Return</p>
                <p className={`text-2xl font-bold ${
                  portfolio.totalReturn >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {portfolio.totalReturn >= 0 ? '+' : ''}{formatCurrency(portfolio.totalReturn)}
                </p>
                <p className={`text-sm ${
                  portfolio.totalReturn >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  ({portfolio.returnPercentage >= 0 ? '+' : ''}{portfolio.returnPercentage}%)
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-purple-100 text-purple-600 mr-4">
                <Activity size={24} />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Cash Available</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(portfolio.cash)}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className={`p-3 rounded-full mr-4 ${
                portfolio.agentActive
                  ? 'bg-green-100 text-green-600'
                  : 'bg-gray-100 text-gray-600'
              }`}>
                <Activity size={24} />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Agent Status</p>
                <p className={`text-lg font-bold ${
                  portfolio.agentActive ? 'text-green-600' : 'text-gray-600'
                }`}>
                  {portfolio.agentActive ? 'Active' : 'Paused'}
                </p>
                <p className="text-sm text-gray-500">Risk: {portfolio.riskLevel}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Holdings */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Current Holdings</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Symbol</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Value</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Return</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {holdings.map((holding) => (
                  <tr key={holding.symbol} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{holding.symbol}</div>
                        <div className="text-sm text-gray-500">{holding.name}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {holding.quantity}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(holding.currentPrice)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(holding.value)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={`text-sm font-medium ${
                        holding.return >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {holding.return >= 0 ? '+' : ''}{formatCurrency(holding.return)}
                      </div>
                      <div className={`text-sm ${
                        holding.return >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        ({holding.returnPercentage >= 0 ? '+' : ''}{holding.returnPercentage}%)
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* AI Agent Information */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-blue-900 font-semibold mb-3">🤖 AI Trading Agent</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-blue-800 mb-2">How It Works</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Our DeepSeek AI analyzes market trends 24/7</li>
                <li>• Makes intelligent buy/sell decisions based on data</li>
                <li>• Automatically rebalances your portfolio</li>
                <li>• Risk management keeps your investments safe</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-blue-800 mb-2">Current Strategy</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Risk Level: {portfolio.riskLevel.charAt(0).toUpperCase() + portfolio.riskLevel.slice(1)}</li>
                <li>• Focus: Large-cap growth stocks</li>
                <li>• Target: 8-12% annual return</li>
                <li>• Stop-loss: 5% maximum position loss</li>
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}