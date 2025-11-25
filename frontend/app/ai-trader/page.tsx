'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'

interface TradeDecision {
  symbol: string
  action: 'buy' | 'sell' | 'hold'
  reasoning: string
  confidence: number
  order?: any
}

interface AIAnalysisResult {
  success: boolean
  timestamp: string
  paperTrading: boolean
  summary: {
    totalAnalyzed: number
    buySignals: number
    sellSignals: number
    holdSignals: number
    averageConfidence: number
    executedTrades: number
  }
  decisions: TradeDecision[]
}

interface Position {
  symbol: string
  quantity: number
  marketValue: number
  costBasis: number
  unrealizedPnl: number
  side: string
}

export default function AITraderPage() {
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<AIAnalysisResult | null>(null)
  const [positions, setPositions] = useState<Position[]>([])
  const [selectedStocks, setSelectedStocks] = useState(['AAPL', 'GOOGL', 'MSFT', 'TSLA', 'NVDA'])
  const [customStock, setCustomStock] = useState('')

  const popularStocks = ['AAPL', 'GOOGL', 'MSFT', 'TSLA', 'NVDA', 'AMZN', 'META', 'NFLX', 'AMD', 'INTC']

  const runAIAnalysis = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/ai-trader', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          symbols: selectedStocks,
          mode: 'full_analysis' 
        })
      })

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`)
      }

      const data = await response.json()
      setResults(data)
      
      // Also refresh positions
      await loadPositions()
      
    } catch (error) {
      console.error('AI Analysis failed:', error)
      alert('AI Analysis failed. Check console for details.')
    } finally {
      setLoading(false)
    }
  }

  const loadPositions = async () => {
    if (typeof window === 'undefined') return; // Only run on client side
    try {
      const response = await fetch('/api/ai-trader')
      if (response.ok) {
        const data = await response.json()
        setPositions(data.positions || [])
      }
    } catch (error) {
      console.error('Failed to load positions:', error)
    }
  }

  useEffect(() => {
    loadPositions()
  }, [])

  const addStock = () => {
    if (customStock && !selectedStocks.includes(customStock.toUpperCase())) {
      setSelectedStocks([...selectedStocks, customStock.toUpperCase()])
      setCustomStock('')
    }
  }

  const removeStock = (stock: string) => {
    setSelectedStocks(selectedStocks.filter(s => s !== stock))
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

  // Load positions on component mount
  useState(() => {
    loadPositions()
  })

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
      <div className="max-w-6xl mx-auto">
        
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl font-bold text-white mb-2">
            🤖 AI Autonomous Trader
          </h1>
          <p className="text-gray-300">
            Let DeepSeek AI analyze markets and make trading decisions automatically
          </p>
        </motion.div>

        {/* Stock Selection */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/10 backdrop-blur-lg rounded-xl p-6 mb-6"
        >
          <h2 className="text-xl font-semibold text-white mb-4">Select Stocks to Analyze</h2>
          
          {/* Popular stocks */}
          <div className="mb-4">
            <p className="text-gray-300 mb-2">Popular stocks:</p>
            <div className="flex flex-wrap gap-2">
              {popularStocks.map(stock => (
                <button
                  key={stock}
                  onClick={() => {
                    if (selectedStocks.includes(stock)) {
                      removeStock(stock)
                    } else {
                      setSelectedStocks([...selectedStocks, stock])
                    }
                  }}
                  className={`px-3 py-1 rounded-lg text-sm transition-all ${
                    selectedStocks.includes(stock)
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {stock}
                </button>
              ))}
            </div>
          </div>

          {/* Custom stock input */}
          <div className="flex gap-2 mb-4">
            <input
              type="text"
              value={customStock}
              onChange={(e) => setCustomStock(e.target.value.toUpperCase())}
              placeholder="Enter stock symbol (e.g., SHOP)"
              className="flex-1 px-3 py-2 rounded-lg bg-white/10 text-white placeholder-gray-400 border border-gray-300"
              onKeyPress={(e) => e.key === 'Enter' && addStock()}
            />
            <button
              onClick={addStock}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Add
            </button>
          </div>

          {/* Selected stocks */}
          <div>
            <p className="text-gray-300 mb-2">Selected for analysis ({selectedStocks.length}):</p>
            <div className="flex flex-wrap gap-2">
              {selectedStocks.map(stock => (
                <span
                  key={stock}
                  className="bg-blue-600 text-white px-3 py-1 rounded-lg text-sm flex items-center gap-2"
                >
                  {stock}
                  <button
                    onClick={() => removeStock(stock)}
                    className="text-blue-200 hover:text-white"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>
        </motion.div>

        {/* AI Control Panel */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white/10 backdrop-blur-lg rounded-xl p-6 mb-6"
        >
          <h2 className="text-xl font-semibold text-white mb-4">AI Trading Control</h2>
          
          <button
            onClick={runAIAnalysis}
            disabled={loading || selectedStocks.length === 0}
            className={`w-full py-4 rounded-xl font-semibold text-lg transition-all ${
              loading || selectedStocks.length === 0
                ? 'bg-gray-600 text-gray-300 cursor-not-allowed'
                : 'bg-gradient-to-r from-green-600 to-blue-600 text-white hover:from-green-700 hover:to-blue-700 shadow-lg hover:shadow-xl'
            }`}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full"></div>
                AI Analyzing Markets...
              </span>
            ) : (
              '🚀 Start AI Trading Analysis'
            )}
          </button>
          
          {selectedStocks.length === 0 && (
            <p className="text-yellow-400 text-sm mt-2">Please select at least one stock to analyze</p>
          )}
        </motion.div>

        {/* Current Positions */}
        {positions.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white/10 backdrop-blur-lg rounded-xl p-6 mb-6"
          >
            <h2 className="text-xl font-semibold text-white mb-4">Current Positions</h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {positions.map((position, index) => (
                <div key={index} className="bg-white/5 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold text-white">{position.symbol}</h3>
                    <span className={`px-2 py-1 rounded text-xs ${position.side === 'long' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {position.side}
                    </span>
                  </div>
                  <div className="space-y-1 text-sm text-gray-300">
                    <div className="flex justify-between">
                      <span>Quantity:</span>
                      <span>{position.quantity}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Market Value:</span>
                      <span>${position.marketValue.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>P&L:</span>
                      <span className={position.unrealizedPnl >= 0 ? 'text-green-400' : 'text-red-400'}>
                        ${position.unrealizedPnl.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* AI Analysis Results */}
        {results && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white/10 backdrop-blur-lg rounded-xl p-6"
          >
            <h2 className="text-xl font-semibold text-white mb-4">AI Analysis Results</h2>
            
            {/* Summary */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-400">{results.summary.buySignals}</div>
                <div className="text-sm text-gray-300">Buy Signals</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-400">{results.summary.sellSignals}</div>
                <div className="text-sm text-gray-300">Sell Signals</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-400">{results.summary.holdSignals}</div>
                <div className="text-sm text-gray-300">Hold Signals</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-400">{results.summary.executedTrades}</div>
                <div className="text-sm text-gray-300">Executed</div>
              </div>
            </div>

            {/* Individual Decisions */}
            <div className="space-y-4">
              {results.decisions.map((decision, index) => (
                <motion.div
                  key={decision.symbol}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white/5 rounded-lg p-4"
                >
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="font-semibold text-white text-lg">{decision.symbol}</h3>
                    <span className={`px-3 py-1 rounded-lg font-medium ${getActionColor(decision.action)}`}>
                      {decision.action.toUpperCase()}
                    </span>
                  </div>
                  
                  <div className="mb-3">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-gray-300 text-sm">Confidence</span>
                      <span className="text-white font-medium">{(decision.confidence * 100).toFixed(1)}%</span>
                    </div>
                    {getConfidenceBar(decision.confidence)}
                  </div>
                  
                  <p className="text-gray-300 text-sm mb-2">{decision.reasoning}</p>
                  
                  {decision.order && (
                    <div className="bg-white/10 rounded p-2 text-xs text-gray-400">
                      Order executed: {decision.order.side} {decision.order.qty} shares @ {decision.order.type}
                    </div>
                  )}
                </motion.div>
              ))}
            </div>

            <div className="mt-4 text-center text-gray-400 text-sm">
              Analysis completed at {new Date(results.timestamp).toLocaleString()}
              {results.paperTrading && <span className="text-yellow-400"> • Paper Trading Mode</span>}
            </div>
          </motion.div>
        )}

      </div>
    </div>
  )
}