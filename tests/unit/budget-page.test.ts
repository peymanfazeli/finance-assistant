import { describe, it, expect } from 'vitest'
import { getMonthIncomeBase } from '../../src/renderer/pages/BudgetPage'
import { amountToPercent } from '../../src/renderer/components/BudgetAmountDialog'
import { Transaction, TransactionType } from '../../src/core/models/types'
import { jalaliToGregorianDateStrFromParts, JalaliDate } from '../../src/core/utils/jalali'

const TODAY: JalaliDate = { jy: 1404, jm: 11, jd: 15 }
const IN_MONTH = jalaliToGregorianDateStrFromParts(1404, 11, 10)
const LAST_MONTH = jalaliToGregorianDateStrFromParts(1404, 10, 10)

function makeTx(overrides?: Partial<Transaction>): Transaction {
  return {
    id: '1',
    date: IN_MONTH,
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

describe('getMonthIncomeBase', () => {
  it('sums income and refunds of the current Jalali month', () => {
    const transactions = [
      makeTx({ id: '1', type: TransactionType.Income, amount: 1000 }),
      makeTx({ id: '2', type: TransactionType.Refund, amount: 150 }),
      makeTx({ id: '3', type: TransactionType.Expense, amount: 400 }),
      makeTx({ id: '4', type: TransactionType.Investment, amount: 200 }),
    ]
    expect(getMonthIncomeBase(transactions, TODAY)).toBe(1150)
  })

  it('ignores transactions outside the current month', () => {
    const transactions = [
      makeTx({ id: '1', type: TransactionType.Income, amount: 1000 }),
      makeTx({ id: '2', date: LAST_MONTH, type: TransactionType.Income, amount: 5000 }),
    ]
    expect(getMonthIncomeBase(transactions, TODAY)).toBe(1000)
  })

  it('returns zero when there is no income this month', () => {
    const transactions = [makeTx({ type: TransactionType.Expense, amount: 400 })]
    expect(getMonthIncomeBase(transactions, TODAY)).toBe(0)
  })
})

describe('amountToPercent', () => {
  it('converts an amount into a share of the base', () => {
    expect(amountToPercent(2000000, 10000000)).toBe(20)
    expect(amountToPercent(10000000, 10000000)).toBe(100)
  })

  it('rounds to whole percent', () => {
    expect(amountToPercent(1, 3000000)).toBe(0)
    expect(amountToPercent(2, 3)).toBe(67)
  })

  it('clamps a single category to 100%', () => {
    expect(amountToPercent(15000000, 10000000)).toBe(100)
  })

  it('returns zero for empty, negative or unparseable amounts', () => {
    expect(amountToPercent(0, 10000000)).toBe(0)
    expect(amountToPercent(-500, 10000000)).toBe(0)
    expect(amountToPercent(NaN, 10000000)).toBe(0)
  })

  it('returns zero when the base is zero instead of dividing by zero', () => {
    expect(amountToPercent(2000000, 0)).toBe(0)
  })
})
