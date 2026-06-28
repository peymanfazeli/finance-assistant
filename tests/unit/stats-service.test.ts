import { describe, it, expect } from 'vitest'
import { StatsService } from '../../src/core/services/StatsService'
import { Transaction, TransactionType } from '../../src/core/models/types'

function makeTx(overrides?: Partial<Transaction>): Transaction {
  return {
    id: '1',
    date: '2026-01-15',
    title: 'Test',
    categoryId: 'cat1',
    type: TransactionType.Expense,
    amount: 100,
    notes: '',
    createdAt: '2026-01-15T10:00:00.000Z',
    updatedAt: '2026-01-15T10:00:00.000Z',
    ...overrides
  }
}

describe('StatsService', () => {
  it('returns zero stats for empty transactions', () => {
    const stats = StatsService.calculate([])
    expect(stats.totalIncome).toBe(0)
    expect(stats.totalExpenses).toBe(0)
    expect(stats.netBalance).toBe(0)
    expect(stats.transactionCount).toBe(0)
  })

  it('calculates income and expenses', () => {
    const transactions = [
      makeTx({ id: '1', type: TransactionType.Income, amount: 1000 }),
      makeTx({ id: '2', type: TransactionType.Expense, amount: 300 }),
      makeTx({ id: '3', type: TransactionType.Expense, amount: 50 })
    ]
    const stats = StatsService.calculate(transactions)
    expect(stats.totalIncome).toBe(1000)
    expect(stats.totalExpenses).toBe(350)
    expect(stats.netBalance).toBe(650)
    expect(stats.transactionCount).toBe(3)
  })

  it('handles refunds in net balance', () => {
    const transactions = [
      makeTx({ id: '1', type: TransactionType.Income, amount: 1000 }),
      makeTx({ id: '2', type: TransactionType.Expense, amount: 500 }),
      makeTx({ id: '3', type: TransactionType.Refund, amount: 100 })
    ]
    const stats = StatsService.calculate(transactions)
    expect(stats.netBalance).toBe(600)
  })
})
