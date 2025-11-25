import { useState, useEffect } from 'react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { TrendingUp, TrendingDown, DollarSign, Activity } from 'lucide-react'
import { tradingAPI } from '@/lib/trading-api'

interface Agent {
  name: string
  totalValue: number
  cash: number
  holdings: Array<{symbol: string, quantity: number, value: number}>
  lastUpdate: string
  totalTrades: number
}

interface PortfolioData {
  agents: Agent[]
  summary: {
    totalAgents: number
    totalValue: number
    activeTrades: number
  }
}

interface StatsCardProps {
  title: string
  value: string | number
  change?: number
  icon: React.ReactNode
  trend?: 'up' | 'down'
}

const StatsCard = ({ title, value, change, icon, trend }: StatsCardProps) => (
  <div className="card">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-gray-600">{title}</p>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        {change !== undefined && (
          <p className={`text-sm flex items-center mt-1 ${
            trend === 'up' ? 'text-success-600' : 'text-danger-600'
          }`}>
            {trend === 'up' ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
            <span className="ml-1">{Math.abs(change)}%</span>
          </p>
        )}
      </div>
      <div className="text-primary-600">
        {icon}
      </div>
    </div>
  </div>
)

export default function Dashboard() {
  const [portfolioData, setPortfolioData] = useState<PortfolioData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchPortfolioData()
    const interval = setInterval(fetchPortfolioData, 30000) // Refresh every 30 seconds
    return () => clearInterval(interval)
  }, [])

  const fetchPortfolioData = async () => {
    try {
      setLoading(true)
      const data = await tradingAPI.getPortfolio()
      setPortfolioData(data)
      setError(null)
    } catch (err: any) {
      setError('Failed to load portfolio data')
      console.error('Portfolio fetch error:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading trading data...</p>
        </div>
      </div>
    )
  }

  if (error || !portfolioData) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">AI Trader Dashboard</h2>
          <p className="text-gray-600">Monitor your AI trading agents in real-time.</p>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <h3 className="text-yellow-800 font-semibold mb-2">⚠️ Trading System Status</h3>
          <p className="text-yellow-700 mb-4">{error || 'No trading data available'}</p>
          <div className="space-y-2 text-sm text-yellow-600">
            <p>• Trading agents not yet initialized</p>
            <p>• Run <code className="bg-yellow-100 px-1 rounded">python main.py</code> to start generating data</p>
            <p>• Portfolio data will appear here once agents begin trading</p>
          </div>
          <button 
            onClick={fetchPortfolioData}
            className="mt-4 px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700"
          >
            Retry
          </button>
        </div>

        {/* Placeholder Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatsCard
            title="Total Portfolio Value"
            value="$0.00"
            icon={<DollarSign size={24} />}
          />
          <StatsCard
            title="Active Agents"
            value={0}
            icon={<Activity size={24} />}
          />
          <StatsCard
            title="Total Trades"
            value={0}
            icon={<TrendingUp size={24} />}
          />
          <StatsCard
            title="Average Return"
            value="0.00%"
            icon={<TrendingUp size={24} />}
          />
        </div>
      </div>
    )
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(value)
  }

  const chartData = [
    { name: 'Jan', value: 10000 },
    { name: 'Feb', value: 10500 },
    { name: 'Mar', value: 11200 },
    { name: 'Apr', value: 10800 },
    { name: 'May', value: 12100 },
    { name: 'Jun', value: portfolioData.summary.totalValue || 12500 },
  ]

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">AI Trader Dashboard</h2>
          <p className="text-gray-600">Monitor your AI trading agents in real-time.</p>
        </div>
        <div className="flex items-center space-x-2">
          <span className="w-2 h-2 bg-green-500 rounded-full"></span>
          <span className="text-sm text-gray-600">Live Data</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Total Portfolio Value"
          value={formatCurrency(portfolioData.summary.totalValue)}
          change={0}
          trend="up"
          icon={<DollarSign size={24} />}
        />
        <StatsCard
          title="Active Agents"
          value={portfolioData.summary.totalAgents}
          icon={<Activity size={24} />}
        />
        <StatsCard
          title="Total Trades"
          value={portfolioData.summary.activeTrades}
          icon={<TrendingUp size={24} />}
        />
        <StatsCard
          title="Average Return"
          value="0.00%"
          trend="up"
          icon={<TrendingUp size={24} />}
        />
      </div>

      {/* Portfolio Performance Chart */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Portfolio Performance</h3>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Area type="monotone" dataKey="value" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.1} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Agents List */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Active Trading Agents</h3>
        {portfolioData.agents.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-4xl mb-4">🤖</div>
            <p className="text-gray-600">No trading agents found. Start the trading system to see AI agents here!</p>
            <div className="mt-4 text-sm text-gray-500">
              Run: <code className="bg-gray-100 px-2 py-1 rounded">python main.py</code>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Agent</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Portfolio Value</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cash</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Holdings</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trades</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Update</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {portfolioData.agents.map((agent) => (
                  <tr key={agent.name} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                        <div className="text-sm font-medium text-gray-900">{agent.name}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(agent.totalValue)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(agent.cash)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {agent.holdings.length} positions
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {agent.totalTrades}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {agent.lastUpdate || 'Never'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}
    </div>
  )
}