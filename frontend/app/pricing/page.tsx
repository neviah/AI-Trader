'use client'

import { useState } from 'react'
import { Check, Star, Zap } from 'lucide-react'
import Navbar from '@/components/Navbar'
import RevenueService, { UserTier } from '@/lib/revenue'

export default function PricingPage() {
  const [selectedTier, setSelectedTier] = useState<string>('FREE')
  const [investmentAmount, setInvestmentAmount] = useState(10000)
  
  const tiers = Object.values(RevenueService.TIERS)
  
  const projectedEarnings = RevenueService.calculateProjectedEarnings(
    investmentAmount,
    12, // 12% expected annual return
    selectedTier
  )

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(value)
  }

  const getTierIcon = (tierId: string) => {
    switch (tierId) {
      case 'free': return <Star className="h-8 w-8 text-blue-600" />
      case 'premium': return <Zap className="h-8 w-8 text-purple-600" />
      case 'pro': return <Star className="h-8 w-8 text-gold-600" />
      default: return <Star className="h-8 w-8" />
    }
  }

  const getTierStyle = (tierId: string) => {
    switch (tierId) {
      case 'premium':
        return 'border-purple-200 bg-purple-50'
      case 'pro':
        return 'border-yellow-200 bg-yellow-50 relative'
      default:
        return 'border-gray-200 bg-white'
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <main className="container mx-auto px-6 py-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Choose Your AI Trading Plan
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Our AI makes money for you, and we only profit when you profit. 
            No hidden fees, transparent pricing, and you keep most of your gains.
          </p>
        </div>

        {/* Pricing Calculator */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8 max-w-md mx-auto">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Calculate Your Potential Earnings</h3>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Investment Amount
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-500">$</span>
              </div>
              <input
                type="number"
                min="1000"
                max="1000000"
                step="1000"
                value={investmentAmount}
                onChange={(e) => setInvestmentAmount(parseInt(e.target.value) || 0)}
                className="block w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Plan
            </label>
            <select
              value={selectedTier}
              onChange={(e) => setSelectedTier(e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {tiers.map((tier) => (
                <option key={tier.id} value={tier.id.toUpperCase()}>
                  {tier.name}
                </option>
              ))}
            </select>
          </div>

          <div className="bg-gray-50 rounded-lg p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Expected Annual Return (12%):</span>
              <span className="font-medium">{formatCurrency(projectedEarnings.grossReturn)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Platform Fees:</span>
              <span className="font-medium text-red-600">-{formatCurrency(projectedEarnings.platformFees)}</span>
            </div>
            <div className="border-t border-gray-200 pt-2 flex justify-between">
              <span className="font-semibold text-gray-900">Your Net Profit:</span>
              <span className="font-bold text-green-600">{formatCurrency(projectedEarnings.netReturn)}</span>
            </div>
          </div>
        </div>

        {/* Pricing Plans */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {tiers.map((tier) => (
            <div key={tier.id} className={`rounded-lg p-6 border-2 ${getTierStyle(tier.id)}`}>
              {tier.id === 'pro' && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <span className="bg-yellow-400 text-yellow-900 px-3 py-1 rounded-full text-xs font-medium">
                    MOST POPULAR
                  </span>
                </div>
              )}
              
              <div className="text-center mb-6">
                <div className="flex justify-center mb-3">
                  {getTierIcon(tier.id)}
                </div>
                <h3 className="text-xl font-bold text-gray-900">{tier.name}</h3>
                {tier.id !== 'free' && (
                  <p className="text-3xl font-bold text-gray-900 mt-2">
                    ${tier.id === 'premium' ? '19' : '49'}
                    <span className="text-lg font-normal text-gray-600">/month</span>
                  </p>
                )}
                {tier.id === 'free' && (
                  <p className="text-3xl font-bold text-green-600 mt-2">FREE</p>
                )}
              </div>

              <div className="space-y-3 mb-6">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">We keep of your profits:</span>
                  <span className="font-bold text-gray-900">{tier.profitSharePercentage}%</span>
                </div>
                
                {tier.tradeFeePercentage > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Trade fee:</span>
                    <span className="font-bold text-gray-900">{tier.tradeFeePercentage}%</span>
                  </div>
                )}
                
                {tier.managementFeePercentage > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Management fee:</span>
                    <span className="font-bold text-gray-900">{tier.managementFeePercentage}% annually</span>
                  </div>
                )}
              </div>

              <ul className="space-y-3 mb-6">
                {tier.features.map((feature, index) => (
                  <li key={index} className="flex items-center">
                    <Check className="h-4 w-4 text-green-500 mr-3 flex-shrink-0" />
                    <span className="text-sm text-gray-700">{feature}</span>
                  </li>
                ))}
              </ul>

              <button className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
                tier.id === 'free'
                  ? 'bg-gray-600 text-white hover:bg-gray-700'
                  : tier.id === 'premium'
                  ? 'bg-purple-600 text-white hover:bg-purple-700'
                  : 'bg-yellow-600 text-white hover:bg-yellow-700'
              }`}>
                {tier.id === 'free' ? 'Start Free' : `Upgrade to ${tier.name.split(' ')[0]}`}
              </button>
            </div>
          ))}
        </div>

        {/* Value Proposition */}
        <div className="mt-16 bg-blue-50 border border-blue-200 rounded-lg p-8">
          <h3 className="text-blue-900 font-bold text-xl mb-4 text-center">
            🎯 Why Our Profit-Sharing Model Works
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl mb-3">🤝</div>
              <h4 className="font-medium text-blue-800 mb-2">Aligned Incentives</h4>
              <p className="text-sm text-blue-700">We only make money when you make money. Our AI is incentivized to maximize your profits.</p>
            </div>
            <div className="text-center">
              <div className="text-3xl mb-3">🛡️</div>
              <h4 className="font-medium text-blue-800 mb-2">No Loss Fees</h4>
              <p className="text-sm text-blue-700">Never pay fees on losing trades. You keep 100% of any losses, we share the gains.</p>
            </div>
            <div className="text-center">
              <div className="text-3xl mb-3">📈</div>
              <h4 className="font-medium text-blue-800 mb-2">Transparent Pricing</h4>
              <p className="text-sm text-blue-700">No hidden fees, no surprises. You see exactly what you pay before every trade.</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}