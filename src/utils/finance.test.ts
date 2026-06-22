import { describe, it, expect } from 'vitest'
import {
  formatCurrency,
  getMonthlyData,
  getCategoryBreakdown,
  calculateMonthlyAverage,
  calculateCategoryTotal,
  getTransactionsByMonth,
  calculateBalance,
  isOutlier,
  generateReport,
} from './finance'
import { Transaction } from '../types'

const makeTx = (overrides: Partial<Transaction> = {}): Transaction => ({
  id: Math.random().toString(36),
  userId: 'test-user',
  description: 'Transação',
  amount: 100,
  type: 'expense',
  category: 'Outros',
  categoryName: 'Outros',
  date: new Date(2026, 0, 1),
  attachments: [],
  createdAt: new Date(2026, 0, 1),
  updatedAt: new Date(2026, 0, 1),
  ...overrides,
})

describe('formatCurrency', () => {
  it('formata valores positivos em BRL', () => {
    expect(formatCurrency(1234.5)).toBe('R$ 1.234,50')
  })

  it('formata zero corretamente', () => {
    expect(formatCurrency(0)).toBe('R$ 0,00')
  })

  it('formata valores negativos', () => {
    expect(formatCurrency(-50)).toBe('-R$ 50,00')
  })
})

describe('calculateBalance', () => {
  it('calcula saldo como receita menos despesa', () => {
    const { balance } = calculateBalance(1000, 400)
    expect(balance).toBe(600)
  })

  it('calcula percentual de receita sobre o total', () => {
    const { percentage } = calculateBalance(1000, 1000)
    expect(percentage).toBe(50)
  })

  it('retorna percentual 0 quando não há movimentação', () => {
    const { balance, percentage } = calculateBalance(0, 0)
    expect(balance).toBe(0)
    expect(percentage).toBe(0)
  })
})

describe('getCategoryBreakdown', () => {
  it('agrupa valores por categoria somando os totais', () => {
    const txs = [
      makeTx({ category: 'Alimentação', amount: 50 }),
      makeTx({ category: 'Alimentação', amount: 30 }),
      makeTx({ category: 'Transporte', amount: 20 }),
    ]
    const breakdown = getCategoryBreakdown(txs)
    expect(breakdown).toEqual(
      expect.arrayContaining([
        { name: 'Alimentação', value: 80 },
        { name: 'Transporte', value: 20 },
      ])
    )
  })

  it('retorna array vazio para lista vazia', () => {
    expect(getCategoryBreakdown([])).toEqual([])
  })
})

describe('calculateMonthlyAverage', () => {
  it('calcula a média mensal de despesas, ignorando receitas', () => {
    const txs = [
      makeTx({ type: 'expense', amount: 100, date: new Date(2026, 0, 5) }),
      makeTx({ type: 'expense', amount: 200, date: new Date(2026, 1, 5) }),
      makeTx({ type: 'income', amount: 9999, date: new Date(2026, 1, 5) }),
    ]
    // (100 no mês 1) + (200 no mês 2) = 300 / 2 meses = 150
    expect(calculateMonthlyAverage(txs)).toBe(150)
  })

  it('retorna 0 quando não há transações', () => {
    expect(calculateMonthlyAverage([])).toBe(0)
  })

  it('retorna 0 quando só há receitas', () => {
    const txs = [makeTx({ type: 'income', amount: 500 })]
    expect(calculateMonthlyAverage(txs)).toBe(0)
  })
})

describe('calculateCategoryTotal', () => {
  it('soma apenas a categoria informada', () => {
    const txs = [
      makeTx({ category: 'Saúde', amount: 80 }),
      makeTx({ category: 'Saúde', amount: 20 }),
      makeTx({ category: 'Lazer', amount: 1000 }),
    ]
    expect(calculateCategoryTotal(txs, 'Saúde')).toBe(100)
  })

  it('filtra também por tipo quando informado', () => {
    const txs = [
      makeTx({ category: 'Salário', type: 'income', amount: 3000 }),
      makeTx({ category: 'Salário', type: 'expense', amount: 50 }),
    ]
    expect(calculateCategoryTotal(txs, 'Salário', 'income')).toBe(3000)
  })
})

describe('getTransactionsByMonth', () => {
  it('filtra transações pelo mês e ano corretos', () => {
    const txs = [
      makeTx({ date: new Date(2026, 5, 10) }),
      makeTx({ date: new Date(2026, 6, 10) }),
      makeTx({ date: new Date(2025, 5, 10) }),
    ]
    const result = getTransactionsByMonth(txs, 5, 2026)
    expect(result).toHaveLength(1)
  })
})

describe('isOutlier', () => {
  it('retorna false quando há menos de 3 valores', () => {
    expect(isOutlier(1000, [1, 2])).toBe(false)
  })

  it('identifica um valor muito acima do esperado como outlier', () => {
    const values = [10, 12, 11, 9, 10, 11, 12, 10, 1000]
    expect(isOutlier(1000, values)).toBe(true)
  })

  it('não marca valores típicos como outliers', () => {
    const values = [10, 12, 11, 9, 10, 11, 12, 10]
    expect(isOutlier(11, values)).toBe(false)
  })
})

describe('getMonthlyData', () => {
  it('retorna array vazio para lista vazia', () => {
    expect(getMonthlyData([])).toEqual([])
  })

  it('acumula o saldo corretamente ao longo dos dias', () => {
    const txs = [
      makeTx({ type: 'income', amount: 100, date: new Date(2026, 0, 1) }),
      makeTx({ type: 'expense', amount: 30, date: new Date(2026, 0, 2) }),
    ]
    const data = getMonthlyData(txs)
    expect(data).toHaveLength(2)
    expect(data[0].balance).toBe(100)
    expect(data[1].balance).toBe(70)
  })
})

describe('generateReport', () => {
  it('resume receitas, despesas e saldo dentro do período', () => {
    const txs = [
      makeTx({ type: 'income', amount: 500, date: new Date(2026, 0, 5) }),
      makeTx({ type: 'expense', amount: 200, date: new Date(2026, 0, 10) }),
      makeTx({ type: 'expense', amount: 999, date: new Date(2026, 2, 1) }), // fora do período
    ]
    const report = generateReport(txs, new Date(2026, 0, 1), new Date(2026, 0, 31))
    expect(report.summary.income).toBe(500)
    expect(report.summary.expense).toBe(200)
    expect(report.summary.balance).toBe(300)
    expect(report.summary.transactionCount).toBe(2)
  })
})
