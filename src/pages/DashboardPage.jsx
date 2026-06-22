import { useEffect, useState } from 'react'
import { TrendingUp, TrendingDown, Wallet, ArrowRight } from 'lucide-react'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { useAuth } from '../hooks/useAuth'
import { useTransactions } from '../hooks/useTransactions'
import { formatCurrency, getMonthlyData, getCategoryBreakdown } from '../utils/finance'
import { format, startOfMonth, endOfMonth } from 'date-fns'

const COLORS = ['#9333ea', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316', '#06b6d4']

export const DashboardPage = () => {
  const { user } = useAuth()
  const { transactions } = useTransactions(user?.uid || null)
  const [stats, setStats] = useState({
    totalIncome: 0,
    totalExpense: 0,
    currentBalance: 0,
    monthlyIncome: 0,
    monthlyExpense: 0,
    monthlyBalance: 0
  })
  const [monthlyData, setMonthlyData] = useState([])
  const [categoryBreakdown, setCategoryBreakdown] = useState([])
  const [recentTransactions, setRecentTransactions] = useState([])

  // Calculate statistics
  useEffect(() => {
    if (transactions.length === 0) return

    const now = new Date()
    const monthStart = startOfMonth(now)
    const monthEnd = endOfMonth(now)

    // All time stats
    const income = transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0)
    const expense = transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0)

    // Monthly stats
    const monthlyTransactions = transactions.filter(
      t => t.date >= monthStart && t.date <= monthEnd
    )
    const monthlyIncome = monthlyTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0)
    const monthlyExpense = monthlyTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0)

    setStats({
      totalIncome: income,
      totalExpense: expense,
      currentBalance: income - expense,
      monthlyIncome,
      monthlyExpense,
      monthlyBalance: monthlyIncome - monthlyExpense
    })

    // Monthly data for chart
    const data = getMonthlyData(transactions)
    setMonthlyData(data)

    // Category breakdown
    const breakdown = getCategoryBreakdown(monthlyTransactions)
    setCategoryBreakdown(breakdown)

    // Recent transactions
    setRecentTransactions(transactions.slice(0, 5))
  }, [transactions])

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="page-header bg-gradient-to-r from-nubank-600 to-nubank-800 text-white rounded-b-3xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <p className="text-nubank-100">Bem-vindo de volta, {user?.displayName || user?.email}!</p>
          </div>
        </div>
      </div>

      <div className="page-content">
        {/* Main Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Current Balance */}
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-nubank-100 dark:bg-nubank-900/30 rounded-lg">
                <Wallet className="text-nubank-600" size={24} />
              </div>
              <span className="text-xs font-semibold text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30 px-3 py-1 rounded-full">
                Geral
              </span>
            </div>
            <p className="text-gray-600 dark:text-gray-400 text-sm mb-2">Saldo Atual</p>
            <h3 className="text-2xl font-bold gradient-text mb-1">
              {formatCurrency(stats.currentBalance)}
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Total de recursos disponíveis
            </p>
          </div>

          {/* Monthly Income */}
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <TrendingUp className="text-green-600" size={24} />
              </div>
              <span className="text-xs font-semibold text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30 px-3 py-1 rounded-full">
                Este mês
              </span>
            </div>
            <p className="text-gray-600 dark:text-gray-400 text-sm mb-2">Receitas</p>
            <h3 className="text-2xl font-bold text-green-600 dark:text-green-400 mb-1">
              {formatCurrency(stats.monthlyIncome)}
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              +{((stats.monthlyIncome / stats.totalIncome) * 100 || 0).toFixed(1)}% do total
            </p>
          </div>

          {/* Monthly Expenses */}
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-lg">
                <TrendingDown className="text-red-600" size={24} />
              </div>
              <span className="text-xs font-semibold text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30 px-3 py-1 rounded-full">
                Este mês
              </span>
            </div>
            <p className="text-gray-600 dark:text-gray-400 text-sm mb-2">Despesas</p>
            <h3 className="text-2xl font-bold text-red-600 dark:text-red-400 mb-1">
              {formatCurrency(stats.monthlyExpense)}
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              +{((stats.monthlyExpense / stats.totalExpense) * 100 || 0).toFixed(1)}% do total
            </p>
          </div>

          {/* Monthly Balance */}
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-lg ${
                stats.monthlyBalance >= 0
                  ? 'bg-blue-100 dark:bg-blue-900/30'
                  : 'bg-yellow-100 dark:bg-yellow-900/30'
              }`}>
                <Wallet className={stats.monthlyBalance >= 0 ? 'text-blue-600' : 'text-yellow-600'} size={24} />
              </div>
              <span className={`text-xs font-semibold px-3 py-1 rounded-full ${
                stats.monthlyBalance >= 0
                  ? 'text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30'
                  : 'text-yellow-600 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-900/30'
              }`}>
                Este mês
              </span>
            </div>
            <p className="text-gray-600 dark:text-gray-400 text-sm mb-2">Resultado</p>
            <h3 className={`text-2xl font-bold mb-1 ${
              stats.monthlyBalance >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-yellow-600 dark:text-yellow-400'
            }`}>
              {formatCurrency(stats.monthlyBalance)}
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {stats.monthlyBalance >= 0 ? 'Superávit' : 'Déficit'} do mês
            </p>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Line Chart */}
          <div className="lg:col-span-2 card p-6">
            <h2 className="text-lg font-bold text-primary mb-6">Evolução do Saldo</h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1f2937',
                    border: 'none',
                    borderRadius: '8px',
                    color: '#fff'
                  }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="balance"
                  stroke="#9333ea"
                  strokeWidth={2}
                  dot={{ fill: '#9333ea', r: 5 }}
                  activeDot={{ r: 7 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Category Breakdown */}
          <div className="card p-6">
            <h2 className="text-lg font-bold text-primary mb-6">Por Categoria</h2>
            {categoryBreakdown.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={categoryBreakdown}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {categoryBreakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatCurrency(value as number)} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-64 text-gray-500 dark:text-gray-400">
                Nenhuma transação neste mês
              </div>
            )}
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-primary">Transações Recentes</h2>
            <a href="/transactions" className="text-nubank-600 hover:text-nubank-700 dark:text-nubank-400 dark:hover:text-nubank-300 text-sm font-semibold flex items-center gap-1 transition-colors">
              Ver todas <ArrowRight size={16} />
            </a>
          </div>

          {recentTransactions.length > 0 ? (
            <div className="space-y-4">
              {recentTransactions.map((transaction) => (
                <div key={transaction.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-lg ${
                      transaction.type === 'income'
                        ? 'bg-green-100 dark:bg-green-900/30'
                        : 'bg-red-100 dark:bg-red-900/30'
                    }`}>
                      {transaction.type === 'income' ? (
                        <TrendingUp className="text-green-600 dark:text-green-400" size={20} />
                      ) : (
                        <TrendingDown className="text-red-600 dark:text-red-400" size={20} />
                      )}
                    </div>
                    <div>
                      <p className="font-semibold text-primary">{transaction.description}</p>
                      <p className="text-sm text-secondary">{format(transaction.date, 'dd/MM/yyyy')}</p>
                    </div>
                  </div>
                  <span className={`text-lg font-bold ${
                    transaction.type === 'income'
                      ? 'text-green-600 dark:text-green-400'
                      : 'text-red-600 dark:text-red-400'
                  }`}>
                    {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center py-12 text-gray-500 dark:text-gray-400">
              <p>Nenhuma transação registrada ainda</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
