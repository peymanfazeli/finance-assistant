import { describe, it, expect } from 'vitest'
import { ImportService } from '../../src/core/services/ImportService'
import { TransactionType } from '../../src/core/models/types'

describe('ImportService', () => {
  it('parses CSV content', () => {
    const csv = 'Date,Title,Category,Type,Amount\n2026-01-15,Test,Food,expense,50'
    const preview = ImportService.parseCSV(csv)
    expect(preview.columns).toEqual(['Date', 'Title', 'Category', 'Type', 'Amount'])
    expect(preview.rows).toHaveLength(1)
    expect(preview.suggestedMapping).toBeDefined()
  })

  it('detects column mappings', () => {
    const csv = 'Date,Description,Category,Type,Amount,Notes\n2026-01-15,A,Food,expense,10,test'
    const preview = ImportService.parseCSV(csv)
    const dateMap = preview.suggestedMapping.find((m) => m.targetField === 'date')
    expect(dateMap?.sourceField).toBe('Date')
    const titleMap = preview.suggestedMapping.find((m) => m.targetField === 'title')
    expect(titleMap?.sourceField).toBe('Description')
  })

  it('applies mapping to rows', () => {
    const csv = 'Date,Title,Category,Type,Amount,Notes\n2026-01-15,Groceries,Food,expense,85.50,Costco'
    const preview = ImportService.parseCSV(csv)
    const imported = ImportService.applyMapping(preview.rows, preview.suggestedMapping)
    expect(imported).toHaveLength(1)
    expect(imported[0].title).toBe('Groceries')
    expect(imported[0].amount).toBe(85.5)
    expect(imported[0].type).toBe(TransactionType.Expense)
  })

  it('interprets income type correctly', () => {
    const csv = 'Date,Title,Category,Type,Amount\n2026-01-15,Salary,Income,income,5000'
    const preview = ImportService.parseCSV(csv)
    const imported = ImportService.applyMapping(preview.rows, preview.suggestedMapping)
    expect(imported[0].type).toBe(TransactionType.Income)
  })

  it('detects duplicates', () => {
    const existing = [
      { date: '2026-01-15', title: 'Test', type: TransactionType.Expense, amount: 50 }
    ]
    const imported = [
      { date: '2026-01-15', title: 'Test', type: TransactionType.Expense, amount: 50, category: 'Food', notes: '' },
      { date: '2026-01-16', title: 'New', type: TransactionType.Income, amount: 100, category: 'Salary', notes: '' }
    ]
    const result = ImportService.detectDuplicates(existing, imported)
    expect(result).toEqual([true, false])
  })

  it('throws on empty CSV', () => {
    expect(() => ImportService.parseCSV('')).toThrow()
  })

  it('parses CSV with quoted fields', () => {
    const csv = 'Date,Title,Notes\n2026-01-15,"Test, with comma","Notes with, comma"'
    const preview = ImportService.parseCSV(csv)
    expect(preview.rows[0]['Title']).toBe('Test, with comma')
    expect(preview.rows[0]['Notes']).toBe('Notes with, comma')
  })
})
