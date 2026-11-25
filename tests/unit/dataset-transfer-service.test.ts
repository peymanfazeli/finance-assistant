import { describe, expect, it } from 'vitest'
import {
  countDatasetRecords,
  DatasetImportError,
  normalizeImportedDataset,
  validateDataset
} from '../../src/core/services/DatasetTransferService'
import { DatasetService } from '../../src/core/services/DatasetService'
import { InstallmentStatus, TransactionType } from '../../src/core/models/types'

const NOW = '2026-02-01T10:00:00.000Z'

function validDataset(): ReturnType<typeof DatasetService.create> {
  const dataset = DatasetService.create('Backup', 'USD', [
    {
      id: 'c1',
      name: 'Food',
      color: '#f00',
      icon: 'meal',
      isDefault: false,
      createdAt: NOW
    }
  ])
  dataset.wallets = [{ id: 'w1', name: 'Cash', initialBalance: 100, color: '#0f0', createdAt: NOW }]
  dataset.receivables = [{
    id: 'r1',
    title: 'Refund',
    categoryId: 'c1',
    totalAmount: 20,
    from: 'Shop',
    notes: '',
    createdAt: NOW,
    updatedAt: NOW
  }]
  dataset.payables = [{
    id: 'p1',
    title: 'Laptop',
    categoryId: 'c1',
    totalAmount: 100,
    to: 'Store',
    notes: '',
    createdAt: NOW,
    updatedAt: NOW,
    installments: [{
      id: 'i1',
      amount: 100,
      dueDate: '2026-03-01',
      status: InstallmentStatus.Pending,
      createdAt: NOW,
      updatedAt: NOW
    }]
  }]
  dataset.transactions = [{
    id: 't1',
    date: '2026-03-01',
    title: 'Laptop payment',
    categoryId: 'c1',
    type: TransactionType.Expense,
    amount: 100,
    notes: '',
    payableId: 'p1',
    installmentId: 'i1',
    createdAt: NOW,
    updatedAt: NOW
  }]
  dataset.categoryTypeMap = { c1: TransactionType.Expense }
  dataset.budgetPercentages = { c1: 50 }
  return dataset
}

describe('DatasetTransferService', () => {
  it('accepts a complete valid dataset and counts all collections', () => {
    const dataset = validDataset()

    expect(() => validateDataset(dataset)).not.toThrow()
    expect(countDatasetRecords(dataset)).toEqual({
      categories: 1,
      wallets: 1,
      receivables: 1,
      payables: 1,
      installments: 1,
      transactions: 1
    })
  })

  it('normalizes legacy datasets through DatasetService', () => {
    const legacy = {
      version: 4,
      name: 'Legacy',
      currency: 'IRR',
      createdAt: NOW,
      updatedAt: NOW,
      transactions: [],
      categories: [{
        id: 'c1',
        name: 'Rent',
        color: '#f00',
        icon: 'home',
        isDefault: false,
        createdAt: NOW
      }],
      receivables: [],
      payables: [{
        id: 'p1',
        title: 'Rent',
        categoryId: 'c1',
        totalAmount: 50,
        to: 'Landlord',
        notes: '',
        createdAt: NOW,
        updatedAt: NOW,
        installments: [{ amount: 50, dueDate: '2026-04-01', status: InstallmentStatus.Pending }]
      }]
    }

    const normalized = normalizeImportedDataset(legacy)

    expect(normalized.version).toBe(5)
    expect(normalized.currency).toBe('toman')
    expect(normalized.wallets).toEqual([])
    expect(normalized.payables?.[0].installments?.[0].id).toBe('p1-installment-1')
  })

  it('rejects duplicate ids and unknown relationships', () => {
    const dataset = validDataset()
    dataset.payables?.push({
      id: 'p1',
      title: 'Duplicate',
      categoryId: 'c1',
      totalAmount: 10,
      to: 'Store',
      notes: '',
      createdAt: NOW,
      updatedAt: NOW
    })
    dataset.transactions[0].walletId = 'missing-wallet'

    expect(() => validateDataset(dataset)).toThrow(DatasetImportError)
    try {
      validateDataset(dataset)
    } catch (error) {
      const message = error instanceof Error ? error.message : ''
      expect(message).toContain('duplicate id')
      expect(message).toContain('unknown wallet')
    }
  })

  it('rejects invalid transaction types and malformed amounts', () => {
    const dataset = validDataset()
    dataset.transactions[0].type = 'gift' as TransactionType
    dataset.transactions[0].amount = Number.NaN

    expect(() => validateDataset(dataset)).toThrow(/invalid transaction type/)
    expect(() => validateDataset(dataset)).toThrow(/finite number/)
  })
})
