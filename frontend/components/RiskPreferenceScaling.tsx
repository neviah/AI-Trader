'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Shield, TrendingUp, AlertTriangle, Info, Settings, Zap } from 'lucide-react'

interface RiskPreference {
  level: 'conservative' | 'moderate' | 'aggressive'
  multiplier: number
  description: string
  maxDrawdown: string
  expectedReturn: string
  volatility: string
}

interface RiskPreferenceScalingProps {
  currentRisk: RiskPreference
  onRiskChange: (newRisk: RiskPreference) => void
  portfolioValue: number
}

const riskProfiles: RiskPreference[] = [
  {
    level: 'conservative',
    multiplier: 0.5,
    description: 'Lower risk, steady growth. Perfect for preserving capital.',
    maxDrawdown: '~4%',
    expectedReturn: '6-8%',
    volatility: 'Low'
  },
  {
    level: 'moderate',
    multiplier: 1.0,
    description: 'Balanced approach. Follow AI decisions at standard size.',
    maxDrawdown: '~8%',
    expectedReturn: '10-15%',
    volatility: 'Medium'
  },
  {
    level: 'aggressive',
    multiplier: 1.5,
    description: 'Higher risk, higher potential returns. For experienced traders.',
    maxDrawdown: '~15%',
    expectedReturn: '18-25%',
    volatility: 'High'
  }
]

export default function RiskPreferenceScaling({ 
  currentRisk, 
  onRiskChange, 
  portfolioValue 
}: RiskPreferenceScalingProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const getRiskIcon = (level: string) => {
    switch (level) {
      case 'conservative': return <Shield className="w-5 h-5 text-green-600" />
      case 'moderate': return <TrendingUp className="w-5 h-5 text-blue-600" />
      case 'aggressive': return <Zap className="w-5 h-5 text-red-600" />
      default: return <Shield className="w-5 h-5 text-gray-600" />
    }
  }

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'conservative': return 'border-green-500 bg-green-50'
      case 'moderate': return 'border-blue-500 bg-blue-50'
      case 'aggressive': return 'border-red-500 bg-red-50'
      default: return 'border-gray-500 bg-gray-50'
    }
  }

  const calculateImpact = (newMultiplier: number) => {
    const currentPositionSize = 1000 // Example position size
    const newPositionSize = currentPositionSize * newMultiplier
    const difference = newPositionSize - currentPositionSize * currentRisk.multiplier
    return {
      newSize: newPositionSize,
      difference,
      percentChange: ((newMultiplier - currentRisk.multiplier) / currentRisk.multiplier) * 100
    }
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Settings className="w-6 h-6 text-purple-600" />
          <h3 className="text-lg font-semibold text-gray-900">Risk Preference</h3>
          <div className="flex items-center gap-2">
            {getRiskIcon(currentRisk.level)}
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
              currentRisk.level === 'conservative' ? 'bg-green-100 text-green-800' :
              currentRisk.level === 'moderate' ? 'bg-blue-100 text-blue-800' :
              'bg-red-100 text-red-800'
            }`}>
              {currentRisk.level.charAt(0).toUpperCase() + currentRisk.level.slice(1)}
            </span>
          </div>
        </div>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-2 px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-md text-sm font-medium transition-colors"
        >
          <Settings className="w-4 h-4" />
          {isExpanded ? 'Hide Settings' : 'Adjust Risk'}
        </button>
      </div>

      {/* Current Risk Display */}
      <div className={`border-l-4 ${getRiskColor(currentRisk.level)} p-4 rounded-r-lg mb-6`}>
        <div className="flex items-start justify-between">
          <div>
            <h4 className="font-medium text-gray-900 mb-1">
              Current: {currentRisk.level.charAt(0).toUpperCase() + currentRisk.level.slice(1)} ({currentRisk.multiplier}x)
            </h4>
            <p className="text-gray-600 text-sm mb-3">{currentRisk.description}</p>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <span className="text-xs text-gray-500">Max Drawdown</span>
                <div className="font-medium text-gray-900">{currentRisk.maxDrawdown}</div>
              </div>
              <div>
                <span className="text-xs text-gray-500">Expected Return</span>
                <div className="font-medium text-gray-900">{currentRisk.expectedReturn}</div>
              </div>
              <div>
                <span className="text-xs text-gray-500">Volatility</span>
                <div className="font-medium text-gray-900">{currentRisk.volatility}</div>
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-600">Position Sizing</div>
            <div className="text-2xl font-bold text-gray-900">{(currentRisk.multiplier * 100).toFixed(0)}%</div>
            <div className="text-xs text-gray-500">of AI decisions</div>
          </div>
        </div>
      </div>

      {/* Risk Selection (Expanded) */}
      {isExpanded && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="space-y-4"
        >
          <div className="flex items-center gap-2 mb-4">
            <Info className="w-4 h-4 text-blue-600" />
            <span className="text-sm text-gray-600">
              Adjusting your risk level changes how much of each AI trade recommendation you execute
            </span>
          </div>

          {riskProfiles.map((profile) => {
            const impact = calculateImpact(profile.multiplier)
            const isSelected = profile.level === currentRisk.level
            
            return (
              <motion.div
                key={profile.level}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onRiskChange(profile)}
                className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                  isSelected 
                    ? `${getRiskColor(profile.level)} border-opacity-100` 
                    : 'border-gray-200 hover:border-gray-300 bg-white'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    {getRiskIcon(profile.level)}
                    <div>
                      <h4 className="font-semibold text-gray-900">
                        {profile.level.charAt(0).toUpperCase() + profile.level.slice(1)}
                      </h4>
                      <span className="text-sm text-gray-600">{profile.multiplier}x multiplier</span>
                    </div>
                  </div>
                  <div className="text-right">
                    {!isSelected && (
                      <div className="text-sm text-gray-600">
                        {impact.percentChange > 0 ? '+' : ''}{impact.percentChange.toFixed(0)}% change
                      </div>
                    )}
                    {isSelected && (
                      <div className="bg-white bg-opacity-50 px-2 py-1 rounded text-sm font-medium">
                        Current
                      </div>
                    )}
                  </div>
                </div>
                
                <p className="text-gray-700 text-sm mb-3">{profile.description}</p>
                
                <div className="grid grid-cols-3 gap-3 text-sm">
                  <div>
                    <span className="text-gray-500">Max Drawdown</span>
                    <div className="font-medium">{profile.maxDrawdown}</div>
                  </div>
                  <div>
                    <span className="text-gray-500">Expected Return</span>
                    <div className="font-medium">{profile.expectedReturn}</div>
                  </div>
                  <div>
                    <span className="text-gray-500">Volatility</span>
                    <div className="font-medium">{profile.volatility}</div>
                  </div>
                </div>
                
                {/* Example Impact */}
                <div className="mt-3 pt-3 border-t border-white border-opacity-50">
                  <div className="text-xs text-gray-600">
                    Example: If AI recommends buying $1,000 of AAPL, you'll buy ${(1000 * profile.multiplier).toFixed(0)}
                  </div>
                </div>
              </motion.div>
            )
          })}
          
          {/* Warning for Aggressive */}
          {currentRisk.level === 'aggressive' && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-medium text-orange-800 mb-1">High Risk Warning</h4>
                  <p className="text-orange-700 text-sm">
                    Aggressive scaling increases both potential gains and losses. Only use if you're comfortable with higher volatility and potential drawdowns of 15% or more.
                  </p>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      )}

      {/* Quick Stats */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <div className="text-sm text-gray-600">Portfolio at Risk</div>
            <div className="text-xl font-bold text-gray-900">
              ${(portfolioValue * 0.8 * currentRisk.multiplier).toLocaleString()}
            </div>
            <div className="text-xs text-gray-500">80% of portfolio × {currentRisk.multiplier}x</div>
          </div>
          <div className="text-center">
            <div className="text-sm text-gray-600">Cash Reserved</div>
            <div className="text-xl font-bold text-gray-900">
              ${(portfolioValue * 0.2).toLocaleString()}
            </div>
            <div className="text-xs text-gray-500">Always kept in cash</div>
          </div>
        </div>
      </div>
    </div>
  )
}