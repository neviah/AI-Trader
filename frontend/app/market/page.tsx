'use client'

import { useState, useEffect } from 'react'
import { TrendingUp, TrendingDown, BarChart3, Eye } from 'lucide-react'
import Navbar from '@/components/Navbar'

interface MarketData {
  symbol: string
  name: string
  price: number
  change: number
  changePercent: number
  volume: number
  marketCap?: number
}

interface MarketNews {
  title: string
  summary: string
  time: string
  sentiment: 'positive' | 'negative' | 'neutral'
}

export default function MarketPage() {
  const [marketData, setMarketData] = useState<MarketData[]>([
    { symbol: 'AAPL', name: 'Apple Inc.', price: 185.20, change: 2.15, changePercent: 1.17, volume: 45123000, marketCap: 2900000000000 },
    { symbol: 'MSFT', name: 'Microsoft Corp.', price: 378.50, change: -1.25, changePercent: -0.33, volume: 22456000, marketCap: 2800000000000 },
    { symbol: 'GOOGL', name: 'Alphabet Inc.', price: 142.30, change: 0.85, changePercent: 0.60, volume: 18789000, marketCap: 1800000000000 },
    { symbol: 'AMZN', name: 'Amazon.com Inc.', price: 155.75, change: -3.20, changePercent: -2.01, volume: 31245000, marketCap: 1600000000000 },
    { symbol: 'TSLA', name: 'Tesla Inc.', price: 242.65, change: 8.45, changePercent: 3.61, volume: 52367000, marketCap: 770000000000 },
    { symbol: 'NVDA', name: 'NVIDIA Corp.', price: 485.20, change: 15.80, changePercent: 3.37, volume: 28945000, marketCap: 1200000000000 },
  ])

  const [news, setNews] = useState<MarketNews[]>([
    { title: 'Fed Signals Potential Rate Cut Next Quarter', summary: 'Federal Reserve hints at possible interest rate reduction amid economic concerns', time: '2 hours ago', sentiment: 'positive' },
    { title: 'Tech Stocks Rally on AI Optimism', summary: 'Major technology companies see gains as AI sector continues expansion', time: '4 hours ago', sentiment: 'positive' },
    { title: 'Energy Sector Faces Headwinds', summary: 'Oil prices decline on oversupply concerns and reduced demand forecasts', time: '6 hours ago', sentiment: 'negative' },
    { title: 'Market Volatility Expected This Week', summary: 'Analysts predict increased market activity ahead of earnings season', time: '8 hours ago', sentiment: 'neutral' },
  ])

  const [selectedTimeframe, setSelectedTimeframe] = useState<'1D' | '1W' | '1M' | '1Y'>('1D')
  
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(value)
  }

  const formatMarketCap = (value: number) => {
    if (value >= 1e12) return `$${(value / 1e12).toFixed(1)}T`
    if (value >= 1e9) return `$${(value / 1e9).toFixed(1)}B`
    if (value >= 1e6) return `$${(value / 1e6).toFixed(1)}M`
    return `$${value.toLocaleString()}`
  }

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return 'text-green-600 bg-green-50 border-green-200'
      case 'negative': return 'text-red-600 bg-red-50 border-red-200'
      default: return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <main className="container mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Market Trends</h1>
          <p className="text-gray-600 mt-2">Real-time market data and analysis</p>
        </div>

        {/* Market Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-green-100 text-green-600 mr-4">
                <TrendingUp size={24} />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">S&P 500</p>
                <p className="text-2xl font-bold text-gray-900">4,785.32</p>
                <p className="text-green-600 text-sm">+0.85% (+40.25)</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-blue-100 text-blue-600 mr-4">
                <BarChart3 size={24} />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">NASDAQ</p>
                <p className="text-2xl font-bold text-gray-900">15,235.89</p>
                <p className="text-green-600 text-sm">+1.23% (+185.42)</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-purple-100 text-purple-600 mr-4">
                <Eye size={24} />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Market Sentiment</p>
                <p className="text-2xl font-bold text-green-600">Bullish</p>
                <p className="text-gray-500 text-sm">AI Confidence: 78%</p>
              </div>
            </div>
          </div>
        </div>

        {/* Stock Watchlist */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Top Stocks</h3>
            <div className="flex space-x-2">
              {['1D', '1W', '1M', '1Y'].map((timeframe) => (
                <button
                  key={timeframe}
                  onClick={() => setSelectedTimeframe(timeframe as any)}
                  className={`px-3 py-1 text-sm rounded-md ${
                    selectedTimeframe === timeframe
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  {timeframe}
                </button>
              ))}
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Symbol</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Change</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Volume</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Market Cap</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {marketData.map((stock) => (
                  <tr key={stock.symbol} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{stock.symbol}</div>
                        <div className="text-sm text-gray-500">{stock.name}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(stock.price)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={`text-sm font-medium ${
                        stock.change >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {stock.change >= 0 ? '+' : ''}{formatCurrency(stock.change)}
                      </div>
                      <div className={`text-sm ${
                        stock.change >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        ({stock.changePercent >= 0 ? '+' : ''}{stock.changePercent}%)
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {stock.volume.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {stock.marketCap ? formatMarketCap(stock.marketCap) : 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Market News */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Market News</h3>
          <div className="space-y-4">
            {news.map((article, index) => (
              <div key={index} className={`border rounded-lg p-4 ${getSentimentColor(article.sentiment)}`}>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900 mb-2">{article.title}</h4>
                    <p className="text-sm text-gray-600 mb-2">{article.summary}</p>
                    <p className="text-xs text-gray-500">{article.time}</p>
                  </div>
                  <div className={`ml-4 px-2 py-1 rounded-full text-xs font-medium ${
                    article.sentiment === 'positive' ? 'bg-green-100 text-green-800' :
                    article.sentiment === 'negative' ? 'bg-red-100 text-red-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {article.sentiment}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* AI Insights */}
        <div className="mt-8 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-blue-900 font-semibold mb-3">🤖 AI Market Analysis</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-blue-800 mb-2">Current Recommendations</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Strong buy signal for tech sector</li>
                <li>• Moderate caution on energy stocks</li>
                <li>• Opportunity in small-cap growth</li>
                <li>• Consider defensive positions</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-blue-800 mb-2">Risk Assessment</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Overall market volatility: Medium</li>
                <li>• Economic indicators: Positive</li>
                <li>• Geopolitical risk: Low</li>
                <li>• Inflation concerns: Decreasing</li>
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}