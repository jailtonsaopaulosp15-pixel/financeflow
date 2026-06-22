import { Transaction } from '../types'
import { format, getMonth, getYear } from 'date-fns'

export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

export const formatDate = (date: Date): string => {
  return format(date, 'dd/MM/yyyy')
}

export const formatMonth = (date: Date): string => {
  return format(date, 'MMMM yyyy')
}

export const getMonthlyData = (transactions: Transaction[]) => {
  const months: Record<string, { balance: number; income: number; expense: number }> = {}

  transactions.forEach((transaction) => {
    const monthKey = format(transaction.date, 'MMM')
    if (!months[monthKey]) {
      months[monthKey] = { balance: 0, income: 0, expense: 0 }
    }

    if (transaction.type === 'income') {
      months[monthKey].income += transaction.amount
    } else {
      months[monthKey].expense += transaction.amount
    }
    months[monthKey].balance = months[monthKey].income - months[monthKey].expense
  })

  return Object.keys(months).map((month) => ({
    month,
    ...months[month],
  }))
}

export const getCategoryBreakdown = (transactions: Transaction[]) => {
  const categories: Record<string, number> = {}

  transactions.forEach((transaction) => {
    const category = transaction.category
    if (!categories[category]) {
      categories[category] = 0
    }
    categories[category] += transaction.amount
  })

  return Object.keys(categories).map((category) => ({
    name: category,
    value: categories[category],
  }))
}

export const calculateMonthlyAverage = (transactions: Transaction[]): number => {
  if (transactions.length === 0) return 0

  const monthlyTotals: Record<string, number> = {}

  transactions.forEach((transaction) => {
    if (transaction.type === 'expense') {
      const monthKey = format(transaction.date, 'yyyy-MM')
      monthlyTotals[monthKey] = (monthlyTotals[monthKey] || 0) + transaction.amount
    }
  })

  const months = Object.keys(monthlyTotals)
  if (months.length === 0) return 0

  const total = Object.values(monthlyTotals).reduce((a, b) => a + b, 0)
  return total / months.length
}

export const calculateCategoryTotal = (
  transactions: Transaction[],
  category: string,
  type?: 'income' | 'expense'
): number => {
  return transactions
    .filter((t) => t.category === category && (!type || t.type === type))
    .reduce((sum, t) => sum + t.amount, 0)
}

export const getTransactionsByMonth = (transactions: Transaction[], month: number, year: number) => {
  return transactions.filter((t) => {
    const tMonth = getMonth(t.date)
    const tYear = getYear(t.date)
    return tMonth === month && tYear === year
  })
}

export const calculateBalance = (
  income: number,
  expense: number
): { balance: number; percentage: number } => {
  const balance = income - expense
  const total = income + expense
  const percentage = total === 0 ? 0 : (income / total) * 100

  return { balance, percentage }
}

export const isOutlier = (value: number, values: number[]): boolean => {
  if (values.length < 3) return false

  const sorted = [...values].sort((a, b) => a - b)
  const q1 = sorted[Math.floor(values.length / 4)]
  const q3 = sorted[Math.floor((values.length * 3) / 4)]
  const iqr = q3 - q1

  return value < q1 - 1.5 * iqr || value > q3 + 1.5 * iqr
}

export const generateReport = (transactions: Transaction[], startDate: Date, endDate: Date) => {
  const filtered = transactions.filter((t) => t.date >= startDate && t.date <= endDate)

  const income = filtered
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0)

  const expense = filtered
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0)

  const categoryBreakdown = getCategoryBreakdown(filtered)

  return {
    period: {
      startDate,
      endDate,
    },
    summary: {
      income,
      expense,
      balance: income - expense,
      transactionCount: filtered.length,
    },
    categories: categoryBreakdown,
    transactions: filtered,
  }
}
