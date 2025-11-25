'use client'

import { useState, useEffect } from 'react'
import { DollarSign, ArrowUpCircle, ArrowDownCircle, CreditCard, Wallet, Crown, Star, Shield, Building2, Plus } from 'lucide-react'
import Navbar from '@/components/Navbar'
import AuthGuard from '@/components/AuthGuard'
import { useAuth } from '@/lib/auth'

export default function WalletPage() {
  const { initialize, isInitialized } = useAuth()
  const [activeTab, setActiveTab] = useState<'deposit' | 'withdraw'>('deposit')
  const [amount, setAmount] = useState('')
  const [loading, setLoading] = useState(false)
  const [selectedTier, setSelectedTier] = useState<'free' | 'premium' | 'pro'>('free')
  const [bankAccounts, setBankAccounts] = useState<any[]>([])
  const [selectedBankAccount, setSelectedBankAccount] = useState<string>('')
  const [showBankConnect, setShowBankConnect] = useState(false)
  const [balanceData, setBalanceData] = useState({
    total: 10000.00,
    trading: 7500.00,
    available: 2500.00
  })

  // Initialize auth when component mounts
  useEffect(() => {
    if (!isInitialized) {
      initialize()
    }
  }, [isInitialized, initialize])

  // Fetch user balance and bank accounts
  useEffect(() => {
    fetchUserBalance()
    fetchBankAccounts()
  }, [])

  const fetchUserBalance = async () => {
    try {
      const response = await fetch('/api/user/balance?userId=user-123')
      if (response.ok) {
        const data = await response.json()
        setBalanceData({
          total: data.total || 10000,
          trading: data.trading || 7500,
          available: data.available || 2500
        })
      }
    } catch (error) {
      console.error('Failed to fetch balance:', error)
    }
  }

  const fetchBankAccounts = async () => {
    try {
      const response = await fetch('/api/banking?userId=user-123')
      if (response.ok) {
        const data = await response.json()
        setBankAccounts(data.bankAccounts || [])
        if (data.bankAccounts?.length > 0) {
          setSelectedBankAccount(data.bankAccounts[0].id)
        }
      }
    } catch (error) {
      console.error('Failed to fetch bank accounts:', error)
    }
  }

  const connectBankAccount = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/banking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'connect_bank',
          userId: 'user-123',
          email: 'demo@ai-trader.com'
        })
      })

      const data = await response.json()
      
      if (response.ok) {
        // In a real app, you'd redirect to Stripe's bank connection flow
        alert('Bank connection flow would start here. In production, this redirects to Stripe\'s secure bank verification.')
        setShowBankConnect(false)
        await fetchBankAccounts()
      } else {
        throw new Error(data.error)
      }
    } catch (error) {
      console.error('Bank connection failed:', error)
      alert('Bank connection failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const userBalance = balanceData.total
  const tradingBalance = balanceData.trading
  const availableBalance = balanceData.available
  const currentTier = 'free'

  const tiers = [
    {
      id: 'free',
      name: 'Free Tier',
      icon: Shield,
      price: 'Free',
      profitShare: '20%',
      tradeFee: '0.1%',
      managementFee: 'None',
      benefits: [
        'You keep 80% of profits',
        'Only pay when you win',
        'Perfect for getting started',
        'Full AI trading features'
      ],
      color: 'blue',
      popular: false
    },
    {
      id: 'premium',
      name: 'Premium',
      icon: Star,
      price: '$19/month',
      profitShare: '15%',
      tradeFee: '0.05%',
      managementFee: '0.5% annually',
      benefits: [
        'You keep 85% of profits',
        'Lower trading fees',
        'Priority support',
        'Advanced analytics'
      ],
      color: 'purple',
      popular: true
    },
    {
      id: 'pro',
      name: 'Pro Tier',
      icon: Crown,
      price: '$49/month',
      profitShare: '10%',
      tradeFee: 'None',
      managementFee: '0.25% annually',
      benefits: [
        'You keep 90% of profits',
        'No trading fees',
        'White-glove support',
        'Custom strategies'
      ],
      color: 'gold',
      popular: false
    }
  ]

  const handleDeposit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    try {
      // Create payment intent
      const response = await fetch('/api/payments/create-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: parseFloat(amount),
          userId: 'user-123' // TODO: Get from auth context
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create payment intent')
      }

      // TODO: Initialize Stripe Elements and redirect to payment form
      console.log('Payment intent created:', data.clientSecret)
      alert(`Payment intent created! In production, this would redirect to Stripe checkout for $${amount}`)
      
      // Mock successful deposit for demo
      setAmount('')
      
      // Update balance after successful deposit
      await fetch('/api/user/balance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: 'user-123',
          amount: parseFloat(amount),
          type: 'deposit',
          transactionId: data.paymentIntentId
        })
      })
      
      // Refresh balance display
      await fetchUserBalance()
      
    } catch (error: any) {
      console.error('Deposit error:', error)
      alert(error.message || 'Failed to process deposit')
    } finally {
      setLoading(false)
    }
  }

    const handleWithdraw = async () => {
    if (!amount || parseFloat(amount) <= 0) return
    if (!selectedBankAccount && bankAccounts.length === 0) {
      alert('Please connect a bank account first')
      return
    }
    
    setLoading(true)
    
    try {
      // Use new banking API with liquidation support
      const response = await fetch('/api/banking', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'withdraw',
          userId: 'user-123',
          amount: parseFloat(amount),
          paymentMethodId: selectedBankAccount || bankAccounts[0]?.id,
          customerId: 'stripe-customer-123',
          liquidationRequired: tradingBalance > 0 // If user has active trades, liquidate first
        })
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Withdrawal failed')
      }
      
      alert(`Withdrawal of $${amount} initiated! ${data.withdrawal.estimatedArrival}`)
      
      // Update balance after successful withdrawal
      await fetch('/api/user/balance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: 'user-123',
          amount: parseFloat(amount),
          type: 'withdraw',
          transactionId: data.withdrawal.id
        })
      })
      
      // Refresh balance display
      await fetchUserBalance()
      setAmount('')
    } catch (error) {
      console.error('Withdrawal failed:', error)
      alert('Withdrawal failed. Please try again.')
    }
    
    setLoading(false)
  }

  const handleTierUpgrade = (tierId: string) => {
    // TODO: Integrate with payment processor for subscription
    console.log('Upgrading to:', tierId)
    alert(`Upgrading to ${tierId} tier! Payment integration coming soon.`)
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        
        <main className="container mx-auto px-6 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Wallet</h1>
            <p className="text-gray-600 mt-2">Manage your funds, view your balance, and choose your trading tier</p>
          </div>

          {/* Current Tier Status */}
          <div className="mb-8 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Current Plan: {tiers.find(t => t.id === currentTier)?.name}</h3>
                <p className="text-gray-600">You keep {tiers.find(t => t.id === currentTier)?.profitShare === '20%' ? '80%' : tiers.find(t => t.id === currentTier)?.profitShare === '15%' ? '85%' : '90%'} of trading profits</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-green-600">{tiers.find(t => t.id === currentTier)?.price}</p>
                <p className="text-sm text-gray-500">Current plan</p>
              </div>
            </div>
          </div>

          {/* Balance Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-blue-100 text-blue-600 mr-4">
                  <Wallet size={24} />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Total Balance</p>
                  <p className="text-2xl font-bold text-gray-900">${userBalance.toLocaleString()}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-green-100 text-green-600 mr-4">
                  <ArrowUpCircle size={24} />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Currently Trading</p>
                  <p className="text-2xl font-bold text-gray-900">${tradingBalance.toLocaleString()}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-purple-100 text-purple-600 mr-4">
                  <DollarSign size={24} />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Available</p>
                  <p className="text-2xl font-bold text-gray-900">${availableBalance.toLocaleString()}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Deposit/Withdraw Section */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <div className="flex space-x-1 mb-6">
              <button
                onClick={() => setActiveTab('deposit')}
                className={`px-4 py-2 text-sm font-medium rounded-md ${
                  activeTab === 'deposit'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                }`}
              >
                <ArrowUpCircle size={16} className="inline mr-2" />
                Deposit Funds
              </button>
              <button
                onClick={() => setActiveTab('withdraw')}
                className={`px-4 py-2 text-sm font-medium rounded-md ${
                  activeTab === 'withdraw'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                }`}
              >
                <ArrowDownCircle size={16} className="inline mr-2" />
                Withdraw Funds
              </button>
            </div>

            {activeTab === 'deposit' && (
              <form onSubmit={handleDeposit} className="max-w-md">
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Deposit Amount
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <DollarSign size={20} className="text-gray-400" />
                    </div>
                    <input
                      type="number"
                      min="10"
                      max="50000"
                      step="0.01"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="0.00"
                      required
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Minimum deposit: $10 | Maximum deposit: $50,000
                  </p>
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Payment Method
                  </label>
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center p-3 border border-gray-300 rounded-md">
                      <CreditCard size={20} className="text-gray-400 mr-2" />
                      <span className="text-sm">Credit/Debit Card</span>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Secure payments powered by Stripe
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={loading || !amount}
                  className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  {loading ? 'Processing...' : `Deposit $${amount || '0'} & Start AI Trading`}
                </button>
                
                <div className="mt-3 bg-blue-50 border border-blue-200 rounded-md p-3">
                  <p className="text-blue-800 text-xs">
                    <strong>Auto-Start AI Trading:</strong> Your deposit will automatically be allocated by our AI across diversified stocks. 
                    You can pause AI trading anytime from your dashboard.
                  </p>
                </div>
              </form>
            )}

            {activeTab === 'withdraw' && (
              <form onSubmit={(e) => { e.preventDefault(); handleWithdraw(); }} className="max-w-md">
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Withdrawal Amount
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <DollarSign size={20} className="text-gray-400" />
                    </div>
                    <input
                      type="number"
                      min="10"
                      max={availableBalance}
                      step="0.01"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="0.00"
                      required
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Available for withdrawal: ${availableBalance.toLocaleString()}
                  </p>
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Bank Account
                  </label>
                  {bankAccounts.length > 0 ? (
                    <div className="space-y-2">
                      {bankAccounts.map((account, index) => (
                        <div
                          key={account.id}
                          onClick={() => setSelectedBankAccount(account.id)}
                          className={`p-3 border rounded-md cursor-pointer flex items-center justify-between ${
                            selectedBankAccount === account.id
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          <div className="flex items-center">
                            <Building2 size={20} className="text-gray-400 mr-3" />
                            <div>
                              <p className="text-sm font-medium">{account.bank_name || 'Bank Account'}</p>
                              <p className="text-xs text-gray-500">****{account.last4}</p>
                            </div>
                          </div>
                          {selectedBankAccount === account.id && (
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          )}
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() => setShowBankConnect(true)}
                        className="text-sm text-blue-600 hover:text-blue-700 flex items-center"
                      >
                        <Plus size={16} className="mr-1" />
                        Add another bank account
                      </button>
                    </div>
                  ) : (
                    <div className="text-center p-6 border-2 border-dashed border-gray-300 rounded-md">
                      <Building2 size={24} className="mx-auto text-gray-400 mb-2" />
                      <p className="text-sm text-gray-600 mb-3">No bank account connected</p>
                      <button
                        type="button"
                        onClick={connectBankAccount}
                        disabled={loading}
                        className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
                      >
                        {loading ? 'Connecting...' : 'Connect Bank Account'}
                      </button>
                    </div>
                  )}
                  <p className="text-xs text-gray-500 mt-2">
                    Withdrawals typically take 3-5 business days to process
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={loading || !amount || parseFloat(amount) > availableBalance}
                  className="w-full bg-red-600 text-white py-3 px-4 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  {loading ? 'Processing...' : `Withdraw $${amount || '0'}`}
                </button>
              </form>
            )}
          </div>

          {/* Recent Transactions */}
          <div className="mt-8 bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Transactions</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between py-3 border-b border-gray-200">
                <div className="flex items-center">
                  <ArrowUpCircle size={20} className="text-green-500 mr-3" />
                  <div>
                    <p className="font-medium text-gray-900">Deposit</p>
                    <p className="text-sm text-gray-500">Nov 15, 2025</p>
                  </div>
                </div>
                <span className="font-medium text-green-600">+$5,000.00</span>
              </div>
              
              <div className="flex items-center justify-between py-3 border-b border-gray-200">
                <div className="flex items-center">
                  <ArrowDownCircle size={20} className="text-red-500 mr-3" />
                  <div>
                    <p className="font-medium text-gray-900">Withdraw</p>
                    <p className="text-sm text-gray-500">Nov 10, 2025</p>
                  </div>
                </div>
                <span className="font-medium text-red-600">-$1,200.00</span>
              </div>
            </div>
          </div>

          {/* Revenue Sharing Info */}
          <div className="mt-8 bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-6">
            <h3 className="text-green-900 font-semibold mb-3">💰 How You Earn Money</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-green-800 mb-2">Your Current Benefits</h4>
                <ul className="text-sm text-green-700 space-y-1">
                  <li>• You keep {currentTier === 'free' ? '80%' : currentTier === 'premium' ? '85%' : '90%'} of all profits</li>
                  <li>• We take {tiers.find(t => t.id === currentTier)?.profitShare} only when you make money</li>
                  <li>• No fees on losing trades</li>
                  <li>• Trade fee: {tiers.find(t => t.id === currentTier)?.tradeFee}</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-green-800 mb-2">Example Scenario</h4>
                <ul className="text-sm text-green-700 space-y-1">
                  <li>• Your AI makes $1,000 profit</li>
                  <li>• You keep: ${currentTier === 'free' ? '800' : currentTier === 'premium' ? '850' : '900'}</li>
                  <li>• We keep: ${currentTier === 'free' ? '200' : currentTier === 'premium' ? '150' : '100'}</li>
                  <li>• Win-win alignment! 🤝</li>
                </ul>
              </div>
            </div>
            <div className="mt-4 text-center">
              <p className="text-sm text-green-600 font-medium">
                <a href="/pricing" className="hover:text-green-700 underline">
                  View detailed pricing comparison →
                </a>
              </p>
            </div>
          </div>
        </main>
      </div>
    </AuthGuard>
  )
}