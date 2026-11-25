import { describe, expect, it } from 'vitest'
import {
  exportCsvDataset,
  exportFinaDataset,
  exportXlsxDataset,
  importCsvDataset,
  importFinaDataset,
  importXlsxDataset,
  isCompleteDatasetCSV,
  isCompleteDatasetWorkbook
} from '../../src/core/services/DatasetBackupService'
import { DatasetService } from '../../src/core/services/DatasetService'
import { DatasetImportError } from '../../src/core/services/DatasetTransferService'
import { ExportService } from '../../src/core/services/ExportService'
import { InstallmentStatus, TransactionType } from '../../src/core/models/types'

function dataset() {
  return DatasetService.create('Backup', 'USD', [
    { id: 'c1', name: 'Food', color: '#f00', icon: 'meal', isDefault: false, createdAt: '2026-02-01T10:00:00.000Z' }
  ])
}

function richDataset() {
  const source = dataset()
  source.wallets = [{ id: 'w1', name: 'Cash', initialBalance: 100, color: '#0f0', createdAt: '2026-02-01T10:00:00.000Z' }]
  source.receivables = [{
    id: 'r1',
    title: 'Refund',
    categoryId: 'c1',
    totalAmount: 20,
    from: 'Shop',
    notes: 'note',
    askDate: '2026-03-02',
    createdAt: '2026-02-01T10:00:00.000Z',
    updatedAt: '2026-02-01T10:00:00.000Z'
  }]
  source.payables = [{
    id: 'p1',
    title: 'Laptop',
    categoryId: 'c1',
    totalAmount: 100,
    to: 'Store',
    notes: 'note',
    dueDate: '2026-04-01',
    installments: [{
      id: 'i1',
      amount: 100,
      dueDate: '2026-03-01',
      status: InstallmentStatus.Pending,
      createdAt: '2026-02-01T10:00:00.000Z',
      updatedAt: '2026-02-01T10:00:00.000Z'
    }],
    createdAt: '2026-02-01T10:00:00.000Z',
    updatedAt: '2026-02-01T10:00:00.000Z'
  }]
  source.transactions = [{
    id: 't1',
    date: '2026-03-01',
    title: 'Laptop payment',
    categoryId: 'c1',
    type: TransactionType.Expense,
    amount: 100,
    notes: 'note',
    payableId: 'p1',
    installmentId: 'i1',
    createdAt: '2026-02-01T10:00:00.000Z',
    updatedAt: '2026-02-01T10:00:00.000Z'
  }]
  source.categoryTypeMap = { c1: TransactionType.Expense }
  source.budgetPercentages = { c1: 50 }
  return source
}

describe('DatasetBackupService FINA support', () => {
  it('exports and imports a complete dataset', () => {
    const source = dataset()
    source.transactions = [{
      id: 't1',
      date: '2026-03-01',
      title: 'Lunch',
      categoryId: 'c1',
      type: TransactionType.Expense,
      amount: 12,
      notes: '',
      createdAt: '2026-02-01T10:00:00.000Z',
      updatedAt: '2026-02-01T10:00:00.000Z'
    }]

    const restored = importFinaDataset(exportFinaDataset(source))

    expect(restored.version).toBe(5)
    expect(restored.name).toBe('Backup')
    expect(restored.currency).toBe('USD')
    expect(restored.categories).toEqual(source.categories)
    expect(restored.transactions).toEqual(source.transactions)
    expect(restored.wallets).toEqual([])
    expect(restored.payables).toEqual([])
  })

  it('rejects invalid JSON and malformed datasets', () => {
    expect(() => importFinaDataset('{')).toThrow(DatasetImportError)
    expect(() => importFinaDataset('{"version":5}')).toThrow(DatasetImportError)
  })
})

describe('DatasetBackupService XLSX support', () => {
  it('round-trips every collection and relationship', () => {
    const source = richDataset()
    const workbook = exportXlsxDataset(source)

    expect(isCompleteDatasetWorkbook(workbook)).toBe(true)
    expect(importXlsxDataset(workbook)).toEqual(source)
  })

  it('does not mistake legacy transaction workbooks for complete backups', () => {
    const source = richDataset()
    const legacyWorkbook = ExportService.toTransactionXLSXBase64(source.transactions, source.categories, source.wallets)

    expect(isCompleteDatasetWorkbook(legacyWorkbook)).toBe(false)
    expect(() => importXlsxDataset(legacyWorkbook)).toThrow(DatasetImportError)
  })
})

describe('DatasetBackupService CSV support', () => {
  it('round-trips every collection and relationship', () => {
    const source = richDataset()
    const csv = exportCsvDataset(source)

    expect(csv.startsWith('\uFEFFrecord_type,record_id,parent_id,data_json')).toBe(true)
    expect(isCompleteDatasetCSV(csv)).toBe(true)
    expect(importCsvDataset(csv)).toEqual(source)
  })

  it('does not mistake legacy transaction CSV for a complete backup', () => {
    const source = richDataset()
    const legacyCsv = ExportService.toTransactionCSV(source.transactions, source.categories, source.wallets)

    expect(isCompleteDatasetCSV(legacyCsv)).toBe(false)
    expect(() => importCsvDataset(legacyCsv)).toThrow(DatasetImportError)
  })
})
