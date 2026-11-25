import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import SettingsPage from '../../src/renderer/pages/SettingsPage'
import {
  exportCsvDataset,
  exportFinaDataset,
  exportXlsxDataset
} from '../../src/core/services/DatasetBackupService'
import { addToast } from '../../src/renderer/components/ToastContainer'

const storeMocks = vi.hoisted(() => {
  const dataset = {
    version: 5,
    name: 'Backup',
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
    settings: { language: 'en', theme: 'dark', lastExportTimestamp: null },
    setLanguage: vi.fn(),
    updateCategoryTypeMap: vi.fn(),
    flushDatasetSave: vi.fn()
  }
})

const apiMocks = {
  showSaveDialog: vi.fn(),
  saveFileBinary: vi.fn(),
  saveFile: vi.fn(),
  saveDataset: vi.fn()
}

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const map: Record<string, string> = {
        'backup.exportFina': 'Export .fina',
        'backup.exportXlsx': 'Export .xlsx',
        'backup.exportCsv': 'Export .csv',
        'backup.import': 'Import complete backup',
        'common.loading': 'Loading...',
        'common.exportSuccess': 'Export successful'
      }
      return map[key] ?? key
    }
  })
}))

vi.mock('../../src/core/store/useAppStore', () => ({
  useAppStore: Object.assign(() => storeMocks, { getState: () => storeMocks })
}))

vi.mock('../../src/core/services/DatasetBackupService', () => ({
  exportFinaDataset: vi.fn(() => 'fina-content'),
  exportXlsxDataset: vi.fn(() => 'xlsx-base64'),
  exportCsvDataset: vi.fn(() => 'csv-content')
}))

vi.mock('../../src/renderer/components/ToastContainer', () => ({
  addToast: vi.fn()
}))

vi.mock('../../src/renderer/components/ThemeToggle', () => ({ default: () => null }))
vi.mock('../../src/renderer/components/WalletManager', () => ({ default: () => null }))
vi.mock('../../src/renderer/components/Modal', () => ({ default: () => null }))
vi.mock('../../src/renderer/i18n/runtime', () => ({ applyLanguage: vi.fn() }))
vi.mock('../../src/renderer/utils/datasetBackup', () => ({
  chooseCompleteDatasetBackup: vi.fn(),
  replaceDatasetWithBackup: vi.fn()
}))

beforeEach(() => {
  vi.clearAllMocks()
  storeMocks.flushDatasetSave.mockResolvedValue(undefined)
  apiMocks.showSaveDialog.mockResolvedValue({ canceled: false, filePath: '/tmp/Backup' })
  apiMocks.saveFileBinary.mockResolvedValue({ success: true })
  apiMocks.saveFile.mockResolvedValue({ success: true })
  apiMocks.saveDataset.mockResolvedValue({ success: true })
  ;(window as any).api = {
    export: {
      showSaveDialog: apiMocks.showSaveDialog,
      saveFileBinary: apiMocks.saveFileBinary,
      saveFile: apiMocks.saveFile
    },
    dataset: {
      save: apiMocks.saveDataset
    }
  }
})

describe('SettingsPage complete dataset export options', () => {
  it('exports .fina through the FINA handler with a .fina dialog and path', async () => {
    apiMocks.showSaveDialog.mockResolvedValueOnce({ canceled: false, filePath: '/tmp/Backup.json' })

    render(<SettingsPage />)
    fireEvent.click(screen.getByText('Export .fina'))

    await waitFor(() => {
      expect(apiMocks.showSaveDialog).toHaveBeenCalledWith('Backup.fina', [
        { name: 'Finance Dataset', extensions: ['fina'] }
      ])
      expect(exportFinaDataset).toHaveBeenCalledWith(storeMocks.dataset)
      expect(apiMocks.saveDataset).toHaveBeenCalledWith('/tmp/Backup.fina', 'fina-content')
    })
    expect(addToast).toHaveBeenCalledWith('success', 'Export successful')
  })

  it('exports .xlsx through the Excel workbook handler', async () => {
    apiMocks.showSaveDialog.mockResolvedValueOnce({ canceled: false, filePath: '/tmp/Backup.xlsx' })

    render(<SettingsPage />)
    fireEvent.click(screen.getByText('Export .xlsx'))

    await waitFor(() => {
      expect(apiMocks.showSaveDialog).toHaveBeenCalledWith('Backup.xlsx', [
        { name: 'Excel Workbook', extensions: ['xlsx'] }
      ])
      expect(exportXlsxDataset).toHaveBeenCalledWith(storeMocks.dataset)
      expect(apiMocks.saveFileBinary).toHaveBeenCalledWith('/tmp/Backup.xlsx', 'xlsx-base64')
    })
    expect(apiMocks.saveDataset).not.toHaveBeenCalled()
  })

  it('exports .csv through the complete CSV handler', async () => {
    apiMocks.showSaveDialog.mockResolvedValueOnce({ canceled: false, filePath: '/tmp/Backup.csv' })

    render(<SettingsPage />)
    fireEvent.click(screen.getByText('Export .csv'))

    await waitFor(() => {
      expect(apiMocks.showSaveDialog).toHaveBeenCalledWith('Backup.csv', [
        { name: 'CSV Backup', extensions: ['csv'] }
      ])
      expect(exportCsvDataset).toHaveBeenCalledWith(storeMocks.dataset)
      expect(apiMocks.saveFile).toHaveBeenCalledWith('/tmp/Backup.csv', 'csv-content')
    })
    expect(apiMocks.saveFileBinary).not.toHaveBeenCalled()
  })
})
