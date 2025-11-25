'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Brain, TrendingUp, TrendingDown, Minus, ChevronDown, ChevronUp, Info, Zap, BarChart3 } from 'lucide-react'

interface AIDecisionProps {
  symbol: string
  action: 'buy' | 'sell' | 'hold'
  reasoning: string
  confidence: number
  targetPrice: number
  currentPrice: number
  timestamp: string
  technicalFactors?: string[]
  fundamentalFactors?: string[]
  amount?: number
}

interface AIReasoningDisplayProps {
  decisions: AIDecisionProps[]
  title?: string
  showExpanded?: boolean
}

export default function AIReasoningDisplay({ 
  decisions, 
  title = "AI Decision Analysis", 
  showExpanded = false 
}: AIReasoningDisplayProps) {
  const [expandedDecisions, setExpandedDecisions] = useState<Set<string>>(new Set())
  const [showDetails, setShowDetails] = useState(showExpanded)

  const toggleDecisionExpanded = (symbol: string) => {
    const newExpanded = new Set(expandedDecisions)
    if (newExpanded.has(symbol)) {
      newExpanded.delete(symbol)
    } else {
      newExpanded.add(symbol)
    }
    setExpandedDecisions(newExpanded)
  }

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'buy': return <TrendingUp className="w-5 h-5 text-green-600" />
      case 'sell': return <TrendingDown className="w-5 h-5 text-red-600" />
      case 'hold': return <Minus className="w-5 h-5 text-yellow-600" />
      default: return <Minus className="w-5 h-5 text-gray-600" />
    }
  }

  const getActionColor = (action: string) => {
    switch (action) {
      case 'buy': return 'border-l-green-500 bg-green-50'
      case 'sell': return 'border-l-red-500 bg-red-50'
      case 'hold': return 'border-l-yellow-500 bg-yellow-50'
      default: return 'border-l-gray-500 bg-gray-50'
    }
  }

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600 bg-green-100'
    if (confidence >= 0.6) return 'text-blue-600 bg-blue-100'
    if (confidence >= 0.4) return 'text-yellow-600 bg-yellow-100'
    return 'text-red-600 bg-red-100'
  }

  if (!decisions || decisions.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-4">
          <Brain className="w-6 h-6 text-purple-600" />
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        </div>
        <div className="text-center py-8 text-gray-500">
          <Brain className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p>No AI decisions available yet</p>
          <p className="text-sm mt-1">Run an analysis to see AI reasoning</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Brain className="w-6 h-6 text-purple-600" />
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded-md text-xs font-medium">
            {decisions.length} decisions
          </span>
        </div>
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="flex items-center gap-2 px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-md text-sm font-medium transition-colors"
        >
          <Info className="w-4 h-4" />
          {showDetails ? 'Hide Details' : 'Show Details'}
          {showDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {/* Decisions Summary */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-green-50 p-3 rounded-lg">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="w-4 h-4 text-green-600" />
            <span className="text-sm font-medium text-green-800">Buy Signals</span>
          </div>
          <span className="text-2xl font-bold text-green-700">
            {decisions.filter(d => d.action === 'buy').length}
          </span>
        </div>
        <div className="bg-red-50 p-3 rounded-lg">
          <div className="flex items-center gap-2 mb-1">
            <TrendingDown className="w-4 h-4 text-red-600" />
            <span className="text-sm font-medium text-red-800">Sell Signals</span>
          </div>
          <span className="text-2xl font-bold text-red-700">
            {decisions.filter(d => d.action === 'sell').length}
          </span>
        </div>
        <div className="bg-yellow-50 p-3 rounded-lg">
          <div className="flex items-center gap-2 mb-1">
            <Minus className="w-4 h-4 text-yellow-600" />
            <span className="text-sm font-medium text-yellow-800">Hold Signals</span>
          </div>
          <span className="text-2xl font-bold text-yellow-700">
            {decisions.filter(d => d.action === 'hold').length}
          </span>
        </div>
      </div>

      {/* Decision Cards */}
      <div className="space-y-3">
        {decisions.map((decision, index) => {
          const isExpanded = expandedDecisions.has(decision.symbol)
          const priceChange = ((decision.targetPrice - decision.currentPrice) / decision.currentPrice * 100)
          
          return (
            <motion.div
              key={`${decision.symbol}-${index}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`border-l-4 ${getActionColor(decision.action)} p-4 rounded-r-lg border border-l-4`}
            >
              {/* Main Decision Row */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  {getActionIcon(decision.action)}
                  <div>
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-gray-900 text-lg">{decision.symbol}</span>
                      <span className={`px-2 py-1 rounded-md text-xs font-medium ${getConfidenceColor(decision.confidence)}`}>
                        {(decision.confidence * 100).toFixed(0)}% confident
                      </span>
                      {decision.amount && (
                        <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded-md text-xs">
                          {decision.amount} shares
                        </span>
                      )}
                    </div>
                    <p className="text-gray-700 text-sm mt-1 max-w-2xl">{decision.reasoning}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="text-sm text-gray-600">Current: ${decision.currentPrice.toFixed(2)}</div>
                    <div className="text-sm text-gray-600">Target: ${decision.targetPrice.toFixed(2)}</div>
                    <div className={`text-xs font-medium ${
                      priceChange > 0 ? 'text-green-600' : priceChange < 0 ? 'text-red-600' : 'text-gray-600'
                    }`}>
                      {priceChange > 0 ? '+' : ''}{priceChange.toFixed(1)}% potential
                    </div>
                  </div>
                  
                  {showDetails && (decision.technicalFactors || decision.fundamentalFactors) && (
                    <button
                      onClick={() => toggleDecisionExpanded(decision.symbol)}
                      className="p-2 hover:bg-white/50 rounded-md transition-colors"
                    >
                      {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </button>
                  )}
                </div>
              </div>

              {/* Expanded Details */}
              <AnimatePresence>
                {showDetails && isExpanded && (decision.technicalFactors || decision.fundamentalFactors) && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="mt-4 pt-4 border-t border-gray-200"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {decision.technicalFactors && decision.technicalFactors.length > 0 && (
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <BarChart3 className="w-4 h-4 text-blue-600" />
                            <h4 className="font-medium text-gray-900">Technical Analysis</h4>
                          </div>
                          <ul className="space-y-1">
                            {decision.technicalFactors.map((factor, idx) => (
                              <li key={idx} className="text-sm text-gray-600 flex items-center gap-2">
                                <div className="w-1.5 h-1.5 bg-blue-400 rounded-full flex-shrink-0" />
                                {factor}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      
                      {decision.fundamentalFactors && decision.fundamentalFactors.length > 0 && (
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <Zap className="w-4 h-4 text-purple-600" />
                            <h4 className="font-medium text-gray-900">Fundamental Analysis</h4>
                          </div>
                          <ul className="space-y-1">
                            {decision.fundamentalFactors.map((factor, idx) => (
                              <li key={idx} className="text-sm text-gray-600 flex items-center gap-2">
                                <div className="w-1.5 h-1.5 bg-purple-400 rounded-full flex-shrink-0" />
                                {factor}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                    
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <span className="text-xs text-gray-500">
                        Decision made at {new Date(decision.timestamp).toLocaleString()}
                      </span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )
        })}
      </div>

      {/* Footer */}
      <div className="mt-6 pt-4 border-t border-gray-200 text-center">
        <p className="text-xs text-gray-500">
          AI decisions are updated in real-time based on market analysis and affect all platform users
        </p>
      </div>
    </div>
  )
}