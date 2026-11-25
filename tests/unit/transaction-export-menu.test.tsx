import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import TransactionPage from '../../src/renderer/pages/TransactionPage'
import { ExportService } from '../../src/core/services/ExportService'
import { exportFinaDataset } from '../../src/core/services/DatasetBackupService'
import { addToast } from '../../src/renderer/components/ToastContainer'

const storeMocks = vi.hoisted(() => {
  const dataset = {
    version: 5,
    name: 'My Finances',
    currency: 'USD',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    transactions: [],
    categories: [],
    receivables: [],
    wallets: [],
    payables: [],
    categoryTypeMap: {},
    budgetPercentages: {}
  }
  return {
    dataset,
    filters: {},
    sortConfig: { field: 'date', direction: 'desc' },
    addTransaction: vi.fn(),
    addCategory: vi.fn(),
    addReceivable: vi.fn(),
    setConfigBaseName: vi.fn(),
    updateTransaction: vi.fn(),
    clearDataset: vi.fn(),
    updateSettings: vi.fn()
  }
})

const apiMocks = {
  showSaveDialog: vi.fn(),
  saveFile: vi.fn(),
  saveFileBinary: vi.fn(),
  saveDataset: vi.fn()
}

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const map: Record<string, string> = {
        'transaction.title': 'Transactions',
        'transaction.add': 'Add Transaction',
        'import.importFile': 'Import File',
        'common.export': 'Export',
        'common.loading': 'Loading...',
        'common.exportSuccess': 'Export successful',
        'nav.close': 'Close'
      }
      return map[key] ?? key
    }
  })
}))

vi.mock('../../src/core/store/useAppStore', () => ({
  useAppStore: Object.assign(() => storeMocks, { getState: () => storeMocks })
}))

vi.mock('../../src/core/services/TransactionService', () => ({
  TransactionService: {
    search: (items: unknown[]) => items,
    filter: (items: unknown[]) => items,
    sort: (items: unknown[]) => items,
    detectDuplicates: () => []
  }
}))

vi.mock('../../src/core/services/ExportService', () => ({
  ExportService: {
    toTransactionCSV: vi.fn(() => 'csv-content'),
    toTransactionXLSXBase64: vi.fn(() => 'xlsx-base64')
  }
}))

vi.mock('../../src/core/services/DatasetBackupService', () => ({
  exportFinaDataset: vi.fn(() => 'fina-content')
}))

vi.mock('../../src/renderer/components/ToastContainer', () => ({
  addToast: vi.fn()
}))

vi.mock('../../src/renderer/components/DropZone', () => ({
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>
}))
vi.mock('../../src/renderer/components/TransactionList', () => ({ default: () => null }))
vi.mock('../../src/renderer/components/TransactionForm', () => ({ default: () => null }))
vi.mock('../../src/renderer/components/Modal', () => ({ default: () => null }))
vi.mock('../../src/renderer/components/ImportModal', () => ({ default: () => null }))
vi.mock('../../src/renderer/components/SearchBar', () => ({ default: () => null }))
vi.mock('../../src/renderer/components/FilterPanel', () => ({ default: () => null }))

beforeEach(() => {
  vi.clearAllMocks()
  apiMocks.showSaveDialog.mockResolvedValue({ canceled: false, filePath: '/tmp/transactions' })
  apiMocks.saveFile.mockResolvedValue({ success: true })
  apiMocks.saveFileBinary.mockResolvedValue({ success: true })
  apiMocks.saveDataset.mockResolvedValue({ success: true })
  ;(window as any).api = {
    export: {
      showSaveDialog: apiMocks.showSaveDialog,
      saveFile: apiMocks.saveFile,
      saveFileBinary: apiMocks.saveFileBinary
    },
    dataset: {
      save: apiMocks.saveDataset
    },
    file: {
      openDialog: vi.fn(),
      read: vi.fn()
    },
    config: {
      readConfigForImport: vi.fn()
    }
  }
})

describe('TransactionPage export menu', () => {
  it('offers .fina and routes it to the FINA export handler', async () => {
    apiMocks.showSaveDialog.mockResolvedValueOnce({ canceled: false, filePath: '/tmp/transactions.json' })

    render(<TransactionPage />)
    fireEvent.click(screen.getByText('Export'))
    fireEvent.click(screen.getByText('.fina'))

    await waitFor(() => {
      expect(apiMocks.showSaveDialog).toHaveBeenCalledWith('My_Finances.fina', [
        { name: 'Finance Dataset', extensions: ['fina'] }
      ])
      expect(exportFinaDataset).toHaveBeenCalledWith(storeMocks.dataset)
      expect(apiMocks.saveDataset).toHaveBeenCalledWith('/tmp/transactions.fina', 'fina-content')
    })
    expect(apiMocks.saveFile).not.toHaveBeenCalled()
    expect(apiMocks.saveFileBinary).not.toHaveBeenCalled()
  })

  it('preserves the CSV export option', async () => {
    render(<TransactionPage />)
    fireEvent.click(screen.getByText('Export'))
    fireEvent.click(screen.getByText('CSV'))

    await waitFor(() => {
      expect(ExportService.toTransactionCSV).toHaveBeenCalled()
      expect(apiMocks.showSaveDialog).toHaveBeenCalledWith('transactions.csv', [
        { name: 'CSV', extensions: ['csv'] }
      ])
      expect(apiMocks.saveFile).toHaveBeenCalledWith('/tmp/transactions', 'csv-content')
    })
    expect(exportFinaDataset).not.toHaveBeenCalled()
  })

  it('preserves the XLSX export option', async () => {
    render(<TransactionPage />)
    fireEvent.click(screen.getByText('Export'))
    fireEvent.click(screen.getByText('XLSX'))

    await waitFor(() => {
      expect(ExportService.toTransactionXLSXBase64).toHaveBeenCalled()
      expect(apiMocks.showSaveDialog).toHaveBeenCalledWith('transactions.xlsx', [
        { name: 'Excel', extensions: ['xlsx'] }
      ])
      expect(apiMocks.saveFileBinary).toHaveBeenCalledWith('/tmp/transactions', 'xlsx-base64')
    })
    expect(exportFinaDataset).not.toHaveBeenCalled()
  })
})
