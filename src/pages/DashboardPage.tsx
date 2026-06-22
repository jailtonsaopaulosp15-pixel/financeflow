import { useEffect, useState } from 'react'
import { TrendingUp, TrendingDown, ArrowRight, CheckCircle2, AlertTriangle } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { useAuth } from '../hooks/useAuth'
import { useTransactions } from '../hooks/useTransactions'
import { useAppStore } from '../store/appStore'
import { formatCurrency, getMonthlyData } from '../utils/finance'
import { format, startOfMonth, endOfMonth, isToday } from 'date-fns'

const COLORS = ['#9333ea', '#f59e0b', '#ec4899', '#10b981', '#6b7280', '#3b82f6', '#ef4444', '#14b8a6', '#8b5cf6', '#f97316']
const CATEGORY_ICONS: Record<string, string> = {
  'Salário': '💰', 'Freelance': '💻', 'Investimentos': '📈',
  'Alimentação': '🍔', 'Transporte': '🚗', 'Saúde': '🏥',
  'Educação': '📚', 'Diversão': '🎬', 'Moradia': '🏠', 'Utilities': '💡',
}

export const DashboardPage = () => {
  const { user } = useAuth()
  const { theme } = useAppStore()
  const { transactions } = useTransactions(user?.uid || null)
  const [stats, setStats] = useState({
    currentBalance: 0,
    monthlyIncome: 0,
    monthlyExpense: 0,
    todayNet: 0,
  })
  const [monthlyData, setMonthlyData] = useState<any[]>([])
  const [categoryBreakdown, setCategoryBreakdown] = useState<{ name: string; value: number }[]>([])
  const [recentTransactions, setRecentTransactions] = useState<typeof transactions>([])

  useEffect(() => {
    if (transactions.length === 0) return

    const now = new Date()
    const monthStart = startOfMonth(now)
    const monthEnd = endOfMonth(now)

    const income = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0)
    const expense = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0)

    const monthlyTransactions = transactions.filter(t => t.date >= monthStart && t.date <= monthEnd)
    const monthlyIncome = monthlyTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0)
    const monthlyExpense = monthlyTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0)

    const todayNet = transactions
      .filter(t => isToday(t.date))
      .reduce((sum, t) => sum + (t.type === 'income' ? t.amount : -t.amount), 0)

    setStats({
      currentBalance: income - expense,
      monthlyIncome,
      monthlyExpense,
      todayNet,
    })

    setMonthlyData(getMonthlyData(transactions))

    const expenseByCategory: Record<string, number> = {}
    monthlyTransactions.filter(t => t.type === 'expense').forEach(t => {
      expenseByCategory[t.category] = (expenseByCategory[t.category] || 0) + t.amount
    })
    const breakdown = Object.entries(expenseByCategory)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
    setCategoryBreakdown(breakdown)

    setRecentTransactions(transactions.slice(0, 6))
  }, [transactions])

  const pctSpent = stats.monthlyIncome > 0
    ? Math.min(100, Math.round((stats.monthlyExpense / stats.monthlyIncome) * 100))
    : 0
  const surplus = stats.monthlyIncome - stats.monthlyExpense
  const radius = 34
  const circumference = 2 * Math.PI * radius
  const totalCategorySpend = categoryBreakdown.reduce((sum, c) => sum + c.value, 0)
  const topCategory = categoryBreakdown[0]

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="page-header">
        {/* Hero card */}
        <div className="bg-gradient-to-br from-nubank-500 via-purple-600 to-fuchsia-700 rounded-3xl p-6 text-white shadow-xl">
          <div className="flex items-center justify-between mb-2">
            <div>
              <p className="text-xs font-semibold tracking-wider text-purple-100 uppercase">Despesas do mês</p>
              <h2 className="text-3xl font-bold mt-1">{formatCurrency(stats.monthlyExpense)}</h2>
            </div>
            <div className="relative w-20 h-20 shrink-0">
              <svg width="80" height="80" viewBox="0 0 80 80">
                <circle cx="40" cy="40" r={radius} stroke="rgba(255,255,255,0.25)" strokeWidth="8" fill="none" />
                <circle
                  cx="40" cy="40" r={radius}
                  stroke="white" strokeWidth="8" fill="none" strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={circumference * (1 - pctSpent / 100)}
                  transform="rotate(-90 40 40)"
                />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-sm font-bold">
                {pctSpent}%
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 text-sm font-medium mb-2">
            {surplus >= 0 ? (
              <>
                <CheckCircle2 size={16} className="text-green-300" />
                <span>Sobra: {formatCurrency(surplus)}</span>
              </>
            ) : (
              <>
                <AlertTriangle size={16} className="text-yellow-300" />
                <span>Déficit: {formatCurrency(Math.abs(surplus))}</span>
              </>
            )}
          </div>

          <div className="w-full h-2 bg-white/20 rounded-full overflow-hidden mb-1">
            <div
              className="h-full bg-white rounded-full transition-all"
              style={{ width: `${pctSpent}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-purple-100 mb-5">
            <span>Gasto: {formatCurrency(stats.monthlyExpense)}</span>
            <span>Receita: {formatCurrency(stats.monthlyIncome)}</span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white/15 rounded-xl p-3">
              <p className="text-xs text-purple-100">Hoje</p>
              <p className="text-lg font-bold">{formatCurrency(stats.todayNet)}</p>
            </div>
            <div className="bg-white/15 rounded-xl p-3">
              <p className="text-xs text-purple-100">Saldo</p>
              <p className="text-lg font-bold">{formatCurrency(stats.currentBalance)}</p>
            </div>
          </div>
        </div>

        {topCategory && (
          <div className="mt-4 card p-4 flex items-start gap-3">
            <span className="text-2xl">{CATEGORY_ICONS[topCategory.name] || '📊'}</span>
            <div>
              <p className="font-semibold text-primary">{topCategory.name} domina os gastos</p>
              <p className="text-sm text-secondary">
                Representa {totalCategorySpend > 0 ? Math.round((topCategory.value / totalCategorySpend) * 100) : 0}% do total do mês — {formatCurrency(topCategory.value)}
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="page-content space-y-6">
        {/* Category breakdown */}
        {categoryBreakdown.length > 0 && (
          <div className="card p-6">
            <h2 className="text-lg font-bold text-primary mb-4">Por Categoria</h2>

            <div className="flex h-3 rounded-full overflow-hidden mb-4">
              {categoryBreakdown.map((cat, i) => (
                <div
                  key={cat.name}
                  style={{
                    width: `${totalCategorySpend > 0 ? (cat.value / totalCategorySpend) * 100 : 0}%`,
                    backgroundColor: COLORS[i % COLORS.length],
                  }}
                />
              ))}
            </div>

            <div className="space-y-4">
              {categoryBreakdown.map((cat, i) => {
                const pct = totalCategorySpend > 0 ? Math.round((cat.value / totalCategorySpend) * 100) : 0
                return (
                  <div key={cat.name}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{CATEGORY_ICONS[cat.name] || '📊'}</span>
                        <span className="font-medium text-primary text-sm">{cat.name}</span>
                      </div>
                      <span className="text-sm font-semibold text-secondary">
                        {formatCurrency(cat.value)} · {pct}%
                      </span>
                    </div>
                    <div className="w-full h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${pct}%`, backgroundColor: COLORS[i % COLORS.length] }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Line chart */}
        <div className="card p-6">
          <h2 className="text-lg font-bold text-primary mb-6">Evolução do Saldo</h2>
          {monthlyData.length >= 2 ? (
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={monthlyData} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke={theme === 'dark' ? '#374151' : '#e5e7eb'}
                  vertical={false}
                />
                <XAxis
                  dataKey="month"
                  tick={{ fill: theme === 'dark' ? '#9ca3af' : '#6b7280', fontSize: 12 }}
                  axisLine={{ stroke: theme === 'dark' ? '#374151' : '#e5e7eb' }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: theme === 'dark' ? '#9ca3af' : '#6b7280', fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                  width={68}
                  tickFormatter={(v) =>
                    Math.abs(v) >= 1000
                      ? `${(v / 1000).toLocaleString('pt-BR', { maximumFractionDigits: 1 })}k`
                      : v.toLocaleString('pt-BR', { maximumFractionDigits: 0 })
                  }
                />
                <Tooltip
                  formatter={(value: number) => formatCurrency(value)}
                  contentStyle={{
                    backgroundColor: theme === 'dark' ? '#1f2937' : '#fff',
                    border: 'none',
                    borderRadius: '8px',
                    color: theme === 'dark' ? '#fff' : '#111827',
                  }}
                  labelStyle={{ color: theme === 'dark' ? '#fff' : '#111827' }}
                />
                <Line
                  type="monotone"
                  dataKey="balance"
                  name="Saldo"
                  stroke="#9333ea"
                  strokeWidth={2}
                  dot={{ fill: '#9333ea', r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-40 flex items-center justify-center text-sm text-secondary text-center px-6">
              Adicione transações em datas diferentes para ver a evolução do saldo aqui.
            </div>
          )}
        </div>

        {/* Recent transactions */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-primary">Transações Recentes</h2>
            <a href="/incomes" className="text-nubank-600 hover:text-nubank-700 dark:text-nubank-400 dark:hover:text-nubank-300 text-sm font-semibold flex items-center gap-1 transition-colors">
              Ver todas <ArrowRight size={16} />
            </a>
          </div>

          {recentTransactions.length > 0 ? (
            <div className="space-y-2">
              {recentTransactions.map((transaction) => (
                <div key={transaction.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-11 h-11 rounded-full flex items-center justify-center text-xl shrink-0 ${
                      transaction.type === 'income'
                        ? 'bg-green-100 dark:bg-green-900/30'
                        : 'bg-amber-100 dark:bg-amber-900/30'
                    }`}>
                      {CATEGORY_ICONS[transaction.category] || (transaction.type === 'income'
                        ? <TrendingUp className="text-green-600" size={20} />
                        : <TrendingDown className="text-red-600" size={20} />)}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-primary truncate">{transaction.description}</p>
                      <p className="text-sm text-secondary">{transaction.category} · {format(transaction.date, 'dd/MM/yyyy')}</p>
                    </div>
                  </div>
                  <span className={`font-bold shrink-0 ${
                    transaction.type === 'income' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
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
