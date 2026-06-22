import { useMemo, useState } from 'react'
import { Download, TrendingUp, TrendingDown, Wallet } from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts'
import { useAuth } from '../hooks/useAuth'
import { useTransactions } from '../hooks/useTransactions'
import { useCategories } from '../hooks/useCategories'
import { useAppStore } from '../store/appStore'
import { formatCurrency } from '../utils/finance'

const FALLBACK_COLORS = ['#9333ea', '#f59e0b', '#ec4899', '#10b981', '#6b7280', '#3b82f6', '#ef4444', '#14b8a6', '#8b5cf6', '#f97316']

const monthKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`

const monthOptions = () => {
  const now = new Date()
  const options: { value: string; label: string }[] = []
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const label = d.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
    options.push({ value: monthKey(d), label: label.charAt(0).toUpperCase() + label.slice(1) })
  }
  return options
}

export const ReportsPage = () => {
  const { user } = useAuth()
  const { theme, addNotification } = useAppStore()
  const { transactions, loading } = useTransactions(user?.uid || null)
  const { categories } = useCategories(user?.uid || null)

  const months = useMemo(monthOptions, [])
  const [selectedMonth, setSelectedMonth] = useState(months[0].value)

  const monthlyTransactions = useMemo(
    () => transactions.filter((t) => monthKey(new Date(t.date)) === selectedMonth),
    [transactions, selectedMonth]
  )

  const income = monthlyTransactions.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0)
  const expense = monthlyTransactions.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
  const balance = income - expense
  const savingsRate = income > 0 ? Math.round((balance / income) * 100) : 0

  const categoryColor = (name: string, i: number) =>
    categories.find((c) => c.name === name)?.color || FALLBACK_COLORS[i % FALLBACK_COLORS.length]

  const expenseByCategory = useMemo(() => {
    const map: Record<string, number> = {}
    monthlyTransactions.filter((t) => t.type === 'expense').forEach((t) => {
      map[t.category] = (map[t.category] || 0) + t.amount
    })
    return Object.entries(map)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
  }, [monthlyTransactions])

  const incomeByCategory = useMemo(() => {
    const map: Record<string, number> = {}
    monthlyTransactions.filter((t) => t.type === 'income').forEach((t) => {
      map[t.category] = (map[t.category] || 0) + t.amount
    })
    return Object.entries(map)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
  }, [monthlyTransactions])

  // Tendência dos últimos 6 meses (receita vs despesa)
  const trend = useMemo(() => {
    const now = new Date()
    const data: { month: string; receita: number; despesa: number }[] = []
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const key = monthKey(d)
      const label = d.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '')
      const monthTx = transactions.filter((t) => monthKey(new Date(t.date)) === key)
      data.push({
        month: label.charAt(0).toUpperCase() + label.slice(1),
        receita: monthTx.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0),
        despesa: monthTx.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0),
      })
    }
    return data
  }, [transactions])

  const handleExportCsv = () => {
    if (monthlyTransactions.length === 0) {
      addNotification('error', 'Não há transações neste período para exportar')
      return
    }

    const header = ['Data', 'Tipo', 'Categoria', 'Descrição', 'Valor']
    const rows = monthlyTransactions
      .slice()
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .map((t) => [
        new Date(t.date).toLocaleDateString('pt-BR'),
        t.type === 'income' ? 'Receita' : 'Despesa',
        t.category,
        `"${t.description.replace(/"/g, '""')}"`,
        t.amount.toFixed(2).replace('.', ','),
      ])

    const csv = [header, ...rows].map((r) => r.join(';')).join('\n')
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `relatorio-financeflow-${selectedMonth}.csv`
    link.click()
    URL.revokeObjectURL(url)
    addNotification('success', 'Relatório exportado com sucesso!')
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="page-header bg-gradient-to-r from-blue-600 to-blue-800 text-white rounded-b-3xl">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Relatórios</h1>
            <p className="text-blue-100">Análise detalhada de suas finanças</p>
          </div>
          <button
            onClick={handleExportCsv}
            className="flex items-center gap-2 bg-white text-blue-700 font-semibold py-2 px-4 rounded-lg hover:shadow-lg transition-all shrink-0"
          >
            <Download size={18} />
            Exportar
          </button>
        </div>
      </div>

      <div className="page-content space-y-6">
        {/* Month filter */}
        <div className="card p-4">
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="form-input max-w-xs"
          >
            {months.map((m) => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </select>
        </div>

        {loading ? (
          <div className="card p-8 text-center text-gray-500 dark:text-gray-400">Carregando...</div>
        ) : (
          <>
            {/* Summary cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="card p-4 flex items-center gap-3">
                <div className="w-11 h-11 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center shrink-0">
                  <TrendingUp className="text-green-600" size={20} />
                </div>
                <div>
                  <p className="text-sm text-secondary">Receitas</p>
                  <p className="text-lg font-bold text-green-600">{formatCurrency(income)}</p>
                </div>
              </div>
              <div className="card p-4 flex items-center gap-3">
                <div className="w-11 h-11 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center shrink-0">
                  <TrendingDown className="text-red-600" size={20} />
                </div>
                <div>
                  <p className="text-sm text-secondary">Despesas</p>
                  <p className="text-lg font-bold text-red-600">{formatCurrency(expense)}</p>
                </div>
              </div>
              <div className="card p-4 flex items-center gap-3">
                <div className="w-11 h-11 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center shrink-0">
                  <Wallet className="text-purple-600" size={20} />
                </div>
                <div>
                  <p className="text-sm text-secondary">Saldo {balance >= 0 ? '(economia ' + savingsRate + '%)' : ''}</p>
                  <p className={`text-lg font-bold ${balance >= 0 ? 'text-purple-600' : 'text-red-600'}`}>
                    {formatCurrency(balance)}
                  </p>
                </div>
              </div>
            </div>

            {/* Trend chart */}
            <div className="card p-6">
              <h2 className="text-lg font-bold text-primary mb-4">Receitas x Despesas (6 meses)</h2>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={trend} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#374151' : '#e5e7eb'} vertical={false} />
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
                    width={60}
                    tickFormatter={(v) => (Math.abs(v) >= 1000 ? `${(v / 1000).toLocaleString('pt-BR', { maximumFractionDigits: 1 })}k` : v)}
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
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="receita" name="Receita" fill="#22c55e" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="despesa" name="Despesa" fill="#ef4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Expense by category */}
            <div className="card p-6">
              <h2 className="text-lg font-bold text-primary mb-4">Despesas por Categoria</h2>
              {expenseByCategory.length === 0 ? (
                <p className="text-sm text-secondary text-center py-6">Nenhuma despesa neste período.</p>
              ) : (
                <div className="space-y-4">
                  {expenseByCategory.map((cat, i) => {
                    const pct = expense > 0 ? Math.round((cat.value / expense) * 100) : 0
                    return (
                      <div key={cat.name}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium text-primary text-sm">{cat.name}</span>
                          <span className="text-sm font-semibold text-secondary">{formatCurrency(cat.value)} · {pct}%</span>
                        </div>
                        <div className="w-full h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: categoryColor(cat.name, i) }} />
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Income by category */}
            <div className="card p-6">
              <h2 className="text-lg font-bold text-primary mb-4">Receitas por Categoria</h2>
              {incomeByCategory.length === 0 ? (
                <p className="text-sm text-secondary text-center py-6">Nenhuma receita neste período.</p>
              ) : (
                <div className="space-y-4">
                  {incomeByCategory.map((cat, i) => {
                    const pct = income > 0 ? Math.round((cat.value / income) * 100) : 0
                    return (
                      <div key={cat.name}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium text-primary text-sm">{cat.name}</span>
                          <span className="text-sm font-semibold text-secondary">{formatCurrency(cat.value)} · {pct}%</span>
                        </div>
                        <div className="w-full h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: categoryColor(cat.name, i) }} />
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
