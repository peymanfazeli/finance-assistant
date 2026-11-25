import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  chooseCompleteDatasetBackup,
  loadCompleteDatasetBackup,
  replaceDatasetWithBackup
} from '../../src/renderer/utils/datasetBackup'
import {
  exportCsvDataset,
  exportFinaDataset,
  exportXlsxDataset
} from '../../src/core/services/DatasetBackupService'
import { DatasetService } from '../../src/core/services/DatasetService'
import { DatasetImportError } from '../../src/core/services/DatasetTransferService'
import { ExportService } from '../../src/core/services/ExportService'
import { TransactionType } from '../../src/core/models/types'

const storeMocks = vi.hoisted(() => ({
  flushDatasetSave: vi.fn(),
  setDataset: vi.fn(),
  setConfigBaseName: vi.fn()
}))

vi.mock('../../src/core/store/useAppStore', () => ({
  useAppStore: {
    getState: () => storeMocks
  }
}))

function toBase64(text: string): string {
  const bytes = new TextEncoder().encode(text)
  let binary = ''
  bytes.forEach((byte) => { binary += String.fromCharCode(byte) })
  return btoa(binary)
}

function sampleDataset() {
  const dataset = DatasetService.create('Backup', 'USD', [
    { id: 'c1', name: 'Food', color: '#f00', icon: 'meal', isDefault: false, createdAt: '2026-02-01T10:00:00.000Z' }
  ])
  dataset.transactions = [{
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
  return dataset
}

const apiMocks = {
  read: vi.fn(),
  showBackupOpenDialog: vi.fn()
}

beforeEach(() => {
  vi.clearAllMocks()
  storeMocks.flushDatasetSave.mockResolvedValue(undefined)
  storeMocks.setDataset.mockResolvedValue(undefined)
  ;(window as any).api = {
    file: { read: apiMocks.read },
    dataset: { showBackupOpenDialog: apiMocks.showBackupOpenDialog }
  }
})

describe('complete dataset backup renderer flow', () => {
  it('loads FINA, XLSX, and CSV backups', async () => {
    const source = sampleDataset()
    const fina = toBase64(exportFinaDataset(source))
    const xlsx = exportXlsxDataset(source)
    const csv = toBase64(exportCsvDataset(source))

    apiMocks.showBackupOpenDialog.mockResolvedValue({ canceled: false, filePaths: ['backup.fina'] })
    apiMocks.read.mockResolvedValueOnce({ success: true, data: fina, ext: 'fina' })
    const fromFina = await chooseCompleteDatasetBackup()
    expect(fromFina?.dataset.name).toBe('Backup')

    apiMocks.read.mockResolvedValueOnce({ success: true, data: xlsx, ext: 'xlsx' })
    const fromXlsx = await loadCompleteDatasetBackup('backup.xlsx')
    expect(fromXlsx.dataset.transactions).toEqual(source.transactions)

    apiMocks.read.mockResolvedValueOnce({ success: true, data: csv, ext: 'csv' })
    const fromCsv = await loadCompleteDatasetBackup('backup.csv')
    expect(fromCsv.dataset.categories).toEqual(source.categories)
  })

  it('flushes pending saves before replacing the active dataset', async () => {
    const backup = { dataset: sampleDataset(), filePath: 'backup.fina' }

    await replaceDatasetWithBackup(backup)

    expect(storeMocks.flushDatasetSave).toHaveBeenCalledTimes(1)
    expect(storeMocks.setDataset).toHaveBeenCalledWith(backup.dataset, backup.filePath)
    expect(storeMocks.setConfigBaseName).toHaveBeenCalledWith('Backup')
    expect(storeMocks.flushDatasetSave.mock.invocationCallOrder[0])
      .toBeLessThan(storeMocks.setDataset.mock.invocationCallOrder[0])
  })

  it('rejects legacy transaction CSV without touching the store', async () => {
    const legacyCsv = ExportService.toTransactionCSV(sampleDataset().transactions, sampleDataset().categories)
    apiMocks.read.mockResolvedValueOnce({ success: true, data: toBase64(legacyCsv), ext: 'csv' })

    await expect(loadCompleteDatasetBackup('transactions.csv')).rejects.toThrow(DatasetImportError)
    expect(storeMocks.flushDatasetSave).not.toHaveBeenCalled()
    expect(storeMocks.setDataset).not.toHaveBeenCalled()
  })

  it('returns null when the backup dialog is canceled', async () => {
    apiMocks.showBackupOpenDialog.mockResolvedValue({ canceled: true, filePaths: [] })

    await expect(chooseCompleteDatasetBackup()).resolves.toBeNull()
    expect(apiMocks.read).not.toHaveBeenCalled()
  })
})
