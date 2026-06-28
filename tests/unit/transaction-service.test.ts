import { describe, it, expect } from 'vitest'
import { TransactionService } from '../../src/core/services/TransactionService'
import { TransactionType, Transaction } from '../../src/core/models/types'

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

describe('TransactionService', () => {
  it('creates a transaction', () => {
    const result = TransactionService.create([], {
      date: '2026-06-01',
      title: 'New',
      categoryId: 'cat1',
      type: TransactionType.Income,
      amount: 500
    })
    expect(result).toHaveLength(1)
    expect(result[0].title).toBe('New')
    expect(result[0].amount).toBe(500)
  })

  it('updates a transaction', () => {
    const tx = makeTx()
    const result = TransactionService.update([tx], '1', { amount: 200 })
    expect(result).toHaveLength(1)
    expect(result[0].amount).toBe(200)
  })

  it('deletes a transaction', () => {
    const tx = makeTx()
    const result = TransactionService.delete([tx], '1')
    expect(result).toHaveLength(0)
  })

  it('duplicates a transaction', () => {
    const tx = makeTx()
    const result = TransactionService.duplicate([tx], '1')
    expect(result).toHaveLength(2)
    expect(result[1].title).toContain('(copy)')
    expect(result[1].id).not.toBe(tx.id)
  })

  it('detects duplicates', () => {
    const tx = makeTx()
    const candidates = [
      { date: '2026-01-15', title: 'Test', type: TransactionType.Expense, amount: 100 },
      { date: '2026-02-01', title: 'Unique', type: TransactionType.Income, amount: 50 }
    ]
    const result = TransactionService.detectDuplicates([tx], candidates)
    expect(result).toEqual([true, false])
  })
})
