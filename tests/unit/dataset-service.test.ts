import { describe, it, expect } from 'vitest'
import { DatasetService } from '../../src/core/services/DatasetService'
import { CategoryService } from '../../src/core/services/CategoryService'
import { Dataset, InstallmentStatus, Payable, TransactionType } from '../../src/core/models/types'

const NOW = '2026-02-01T10:00:00.000Z'

function legacyPayable(overrides: Partial<Payable> = {}): Payable {
  return {
    id: 'p1',
    title: 'Rent',
    categoryId: 'cat-1',
    totalAmount: 100,
    to: 'Landlord',
    notes: '',
    createdAt: NOW,
    updatedAt: NOW,
    ...overrides
  }
}

function legacyDataset(payables: Payable[], transactions: Dataset['transactions'] = [], version = 4): Dataset {
  return {
    version,
    name: 'Legacy',
    currency: 'toman',
    createdAt: NOW,
    updatedAt: NOW,
    transactions,
    categories: [],
    receivables: [],
    payables
  }
}

describe('DatasetService', () => {
  it('creates a new dataset at the current schema version', () => {
    const categories = CategoryService.createDefaultCategories()
    const dataset = DatasetService.create('Test', 'USD', categories)
    expect(dataset.name).toBe('Test')
    expect(dataset.currency).toBe('USD')
    expect(dataset.version).toBe(5)
    expect(dataset.transactions).toHaveLength(0)
    expect(dataset.categories.length).toBeGreaterThanOrEqual(9)
  })

  it('serializes and deserializes a dataset', () => {
    const categories = CategoryService.createDefaultCategories()
    const dataset = DatasetService.create('SerTest', 'EUR', categories)
    const json = DatasetService.serialize(dataset)
    const parsed = JSON.parse(json)
    expect(parsed.name).toBe('SerTest')
    expect(parsed.currency).toBe('EUR')

    const loaded = DatasetService.deserialize(json)
    expect(loaded.name).toBe('SerTest')
    expect(loaded.currency).toBe('EUR')
    expect(loaded.budgetPercentages).toEqual({})
  })

  it('throws on invalid JSON during deserialize', () => {
    expect(() => DatasetService.deserialize('not json')).toThrow()
  })

  it('throws when version field is missing', () => {
    expect(() => DatasetService.deserialize(JSON.stringify({}))).toThrow(
      'Invalid dataset file: missing version field'
    )
  })

  it('migrates version 4 datasets and backfills unambiguous legacy links', () => {
    const dataset = legacyDataset(
      [legacyPayable()],
      [{
        id: 't1',
        date: '2026-02-10',
        title: 'Payment to Landlord',
        categoryId: 'cat-1',
        type: TransactionType.Expense,
        amount: 100,
        notes: '',
        createdAt: NOW,
        updatedAt: NOW
      }]
    )
    const loaded = DatasetService.deserialize(JSON.stringify(dataset))

    expect(loaded.version).toBe(5)
    expect(loaded.transactions[0].payableId).toBe('p1')
    expect(loaded.payables?.[0].installments).toEqual([])
  })

  it('does not backfill ambiguous legacy matches', () => {
    const dataset = legacyDataset(
      [legacyPayable({ id: 'p1' }), legacyPayable({ id: 'p2', title: 'Other rent' })],
      [{
        id: 't1',
        date: '2026-02-10',
        title: 'Payment to Landlord',
        categoryId: 'cat-1',
        type: TransactionType.Expense,
        amount: 100,
        notes: '',
        createdAt: NOW,
        updatedAt: NOW
      }]
    )
    const loaded = DatasetService.deserialize(JSON.stringify(dataset))

    expect(loaded.transactions[0].payableId).toBeUndefined()
  })

  it('normalizes installment ids and timestamps during migration', () => {
    const dataset = legacyDataset([legacyPayable({
      installments: [{
        id: '',
        amount: 100,
        dueDate: '2026-03-01',
        status: InstallmentStatus.Pending
      }]
    })])

    const loaded = DatasetService.deserialize(JSON.stringify(dataset))
    const installment = loaded.payables?.[0].installments?.[0]

    expect(installment?.id).toBe('p1-installment-1')
    expect(installment?.createdAt).toBe(NOW)
    expect(installment?.updatedAt).toBe(NOW)
  })

  it('does not downgrade datasets from a newer schema version', () => {
    const dataset = legacyDataset([], [], 99)
    const loaded = DatasetService.deserialize(JSON.stringify(dataset))
    expect(loaded.version).toBe(99)
  })
})
