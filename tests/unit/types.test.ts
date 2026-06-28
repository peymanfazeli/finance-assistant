import { describe, it, expect } from 'vitest'
import { TransactionType, Language } from '../../src/core/models/types'

describe('TransactionType enum', () => {
  it('has expected values', () => {
    expect(TransactionType.Income).toBe('income')
    expect(TransactionType.Expense).toBe('expense')
    expect(TransactionType.Refund).toBe('refund')
  })
})

describe('Language enum', () => {
  it('has expected values', () => {
    expect(Language.En).toBe('en')
    expect(Language.Fa).toBe('fa')
  })
})
