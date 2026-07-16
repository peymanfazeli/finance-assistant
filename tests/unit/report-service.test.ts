import { describe, it, expect } from 'vitest'
import { ReportService, Grouping, Aggregation } from '../../src/core/services/ReportService'
import { Transaction, TransactionType, Category } from '../../src/core/models/types'

const categories: Category[] = [
  { id: 'c1', name: 'Food', color: '#f00', icon: 'a', isDefault: true, createdAt: '' },
  { id: 'c2', name: 'Income', color: '#0f0', icon: 'b', isDefault: true, createdAt: '' }
]

const transactions: Transaction[] = [
  { id: '1', date: '2026-01-15', title: 'Groceries', categoryId: 'c1', type: TransactionType.Expense, amount: 100, notes: '', createdAt: '', updatedAt: '' },
  { id: '2', date: '2026-01-20', title: 'Salary', categoryId: 'c2', type: TransactionType.Income, amount: 5000, notes: '', createdAt: '', updatedAt: '' },
  { id: '3', date: '2026-02-01', title: 'Dinner', categoryId: 'c1', type: TransactionType.Expense, amount: 50, notes: '', createdAt: '', updatedAt: '' }
]

describe('ReportService', () => {
  it('generates expense by category report', () => {
    const result = ReportService.generate(transactions, categories, 'expenseByCategory')
    expect(result).toHaveLength(1)
    expect(result[0].name).toBe('Food')
    expect(result[0].value).toBe(150)
  })

  it('generates income by category report', () => {
    const result = ReportService.generate(transactions, categories, 'incomeByCategory')
    expect(result).toHaveLength(1)
    expect(result[0].value).toBe(5000)
  })

  it('generates top expenses', () => {
    const result = ReportService.generate(transactions, categories, 'topExpenses')
    expect(result).toHaveLength(2)
    expect(result[0].value).toBe(100)
  })

  it('filters by date range', () => {
    const result = ReportService.generate(transactions, categories, 'expenseByCategory', '2026-02-01')
    expect(result[0].value).toBe(50)
  })

  it('generates all by category report with both income and expense', () => {
    const result = ReportService.generate(transactions, categories, 'allByCategory')
    expect(result).toHaveLength(2)
    const food = result.find(r => r.name === 'Food')
    const income = result.find(r => r.name === 'Income')
    expect(food?.value).toBe(150)
    expect(income?.value).toBe(5000)
    expect(food?.color).toBe('#e17055')
    expect(income?.color).toBe('#00b894')
  })
})

describe('ReportService.generateCustom', () => {
  it('groups and sums by month by default', () => {
    const result = ReportService.generateCustom(transactions, {
      grouping: 'month',
      aggregation: 'sum',
      types: ['expense']
    })
    expect(result).toHaveLength(2)
    expect(result[0].expense).toBe(100)
    expect(result[1].expense).toBe(50)
  })

  it('groups by year', () => {
    const result = ReportService.generateCustom(transactions, {
      grouping: 'year',
      aggregation: 'sum'
    })
    expect(result).toHaveLength(1)
    expect(result[0].expense).toBe(5150)
  })

  it('aggregates with count', () => {
    const result = ReportService.generateCustom(transactions, {
      grouping: 'month',
      aggregation: 'count'
    })
    expect(result).toHaveLength(2)
    expect(result[0].expense).toBe(2)
    expect(result[1].expense).toBe(1)
  })

  it('aggregates with avg', () => {
    const result = ReportService.generateCustom(transactions, {
      grouping: 'month',
      aggregation: 'avg',
      types: ['expense']
    })
    expect(result).toHaveLength(2)
    expect(result[0].expense).toBe(100)
    expect(result[1].expense).toBe(50)
  })

  it('filters by categoryIds', () => {
    const result = ReportService.generateCustom(transactions, {
      grouping: 'month',
      aggregation: 'sum',
      categoryIds: ['c1']
    })
    expect(result).toHaveLength(2)
    expect(result[0].expense).toBe(100)
    expect(result[1].expense).toBe(50)
  })

  it('filters by date range', () => {
    const result = ReportService.generateCustom(transactions, {
      grouping: 'month',
      aggregation: 'sum',
      dateFrom: '2026-02-01'
    })
    expect(result).toHaveLength(1)
  })

  it('returns empty for no matching data', () => {
    const result = ReportService.generateCustom(transactions, {
      grouping: 'month',
      aggregation: 'sum',
      dateFrom: '2030-01-01'
    })
    expect(result).toHaveLength(0)
  })
})
