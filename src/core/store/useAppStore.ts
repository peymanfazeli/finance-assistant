import { create } from 'zustand'
import {
  Dataset,
  Transaction,
  Category,
  Receivable,
  ApplicationSettings,
  TransactionFilter,
  SortConfig,
  DashboardCardId,
  Language,
  TransactionType
} from '../models/types'
import { DatasetService } from '../services/DatasetService'
import { SettingsService } from '../services/SettingsService'
import { CategoryService } from '../services/CategoryService'
import { TransactionService } from '../services/TransactionService'
import { ReceivableService } from '../services/ReceivableService'
import { StatsService, DashboardStats } from '../services/StatsService'

interface AppState {
  dataset: Dataset | null
  datasetPath: string | null
  configBaseName: string | null
  settings: ApplicationSettings
  stats: DashboardStats
  filters: TransactionFilter
  sortConfig: SortConfig
  visibleCards: DashboardCardId[]

  setDataset: (dataset: Dataset, path: string) => void
  setConfigBaseName: (name: string) => void
  setSettings: (settings: ApplicationSettings) => void
  clearDataset: () => void
  saveDataset: () => Promise<void>
  saveDatasetQueued: () => Promise<void>
  saveSettings: () => Promise<void>

  addTransaction: (data: {
    date: string
    title: string
    categoryId: string
    type: TransactionType
    amount: number
    notes?: string
  }) => void
  updateTransaction: (id: string, updates: Partial<Transaction>) => void
  deleteTransaction: (id: string) => void
  duplicateTransaction: (id: string) => void

  addCategory: (name: string, color: string, icon: string) => void
  updateCategory: (id: string, updates: Partial<Pick<Category, 'name' | 'color' | 'icon'>>) => void
  deleteCategory: (id: string, reassignToId: string) => void
  syncCategoriesConfig: () => void
  updateCategoryTypeMap: (categoryId: string, type: TransactionType | null) => void

  addReceivable: (data: {
    title: string
    categoryId: string
    totalAmount: number
    from: string
    notes?: string
  }) => void
  updateReceivable: (id: string, updates: Partial<Pick<Receivable, 'title' | 'categoryId' | 'totalAmount' | 'from' | 'notes'>>) => void
  deleteReceivable: (id: string) => void
  syncReceivablesConfig: () => void

  setFilters: (filters: TransactionFilter) => void
  setSortConfig: (config: SortConfig) => void
  setVisibleCards: (cards: DashboardCardId[]) => void

  setLanguage: (language: Language) => void
  updateSettings: (updates: Partial<ApplicationSettings>) => void
}

const defaultSettings: ApplicationSettings = {
  language: Language.En,
  visibleDashboardCards: [
    'totalIncome',
    'totalExpenses',
    'netBalance',
    'transactionCount',
    'avgDailySpending',
    'avgWeeklySpending'
  ],
  lastOpenedDataset: null,
  recentDatasets: [],
  lastExportTimestamp: null,
}

let savePromise: Promise<void> = Promise.resolve()

function queuedSave(saveFn: () => Promise<void>): Promise<void> {
  savePromise = savePromise.then(saveFn, saveFn)
  return savePromise
}

export const useAppStore = create<AppState>((set, get) => ({
  dataset: null,
  datasetPath: null,
  configBaseName: null,
  settings: defaultSettings,
  stats: {
    totalIncome: 0,
    totalExpenses: 0,
    netBalance: 0,
    transactionCount: 0,
    avgDailySpending: 0,
    avgWeeklySpending: 0
  },
  filters: {},
  sortConfig: { field: 'date', direction: 'desc' },
  visibleCards: defaultSettings.visibleDashboardCards,

  setDataset: (dataset, path) => {
    set({
      dataset,
      datasetPath: path,
      stats: StatsService.calculate(dataset.transactions)
    })
    if (path) {
      get().updateSettings({ lastOpenedDataset: path })
    }
  },

  setConfigBaseName: (name) => set({ configBaseName: name }),

  setSettings: (settings) => {
    set({ settings })
  },

  clearDataset: () => {
    set({
      dataset: null,
      datasetPath: null,
      configBaseName: null,
      stats: {
        totalIncome: 0,
        totalExpenses: 0,
        netBalance: 0,
        transactionCount: 0,
        avgDailySpending: 0,
        avgWeeklySpending: 0
      }
    })
    get().updateSettings({ lastOpenedDataset: null })
  },

  saveDataset: async () => {
    const { dataset, datasetPath } = get()
    if (dataset && datasetPath) {
      await window.api.invoke('app:saveStarted')
      const content = DatasetService.serialize(dataset)
      const result = await window.api.dataset.save(datasetPath, content)
      await window.api.invoke('app:saveCompleted')
      if (!result.success) {
        const errorMsg = result.error || 'Unknown error'
        await window.api.invoke('log:error', 'dataset:save', errorMsg)
        console.error('Failed to save dataset:', errorMsg)
      }
    }
  },

  saveDatasetQueued: () => queuedSave(() => get().saveDataset()),

  saveSettings: async () => {
    const { settings } = get()
    const content = SettingsService.serialize(settings)
    const result = await window.api.settings.save(content)
    if (!result.success) {
      const errorMsg = result.error || 'Unknown error'
      await window.api.invoke('log:error', 'settings:save', errorMsg)
    }
  },

  addTransaction: (data) => {
    const { dataset } = get()
    if (!dataset) return
    const updated = TransactionService.create(dataset.transactions, data)
    const newDataset = { ...dataset, transactions: updated }
    set({
      dataset: newDataset,
      stats: StatsService.calculate(updated)
    })
    get().saveDatasetQueued()
  },

  updateTransaction: (id, updates) => {
    const { dataset } = get()
    if (!dataset) return
    const updated = TransactionService.update(dataset.transactions, id, updates)
    const newDataset = { ...dataset, transactions: updated }
    set({
      dataset: newDataset,
      stats: StatsService.calculate(updated)
    })
    get().saveDatasetQueued()
  },

  deleteTransaction: (id) => {
    const { dataset } = get()
    if (!dataset) return
    const updated = TransactionService.delete(dataset.transactions, id)
    const newDataset = { ...dataset, transactions: updated }
    set({
      dataset: newDataset,
      stats: StatsService.calculate(updated)
    })
    get().saveDatasetQueued()
  },

  duplicateTransaction: (id) => {
    const { dataset } = get()
    if (!dataset) return
    const updated = TransactionService.duplicate(dataset.transactions, id)
    const newDataset = { ...dataset, transactions: updated }
    set({
      dataset: newDataset,
      stats: StatsService.calculate(updated)
    })
    get().saveDatasetQueued()
  },

  syncCategoriesConfig: () => {
    const { dataset, configBaseName } = get()
    if (!dataset) return
    const configData = dataset.categories.map((c) => ({
      name: c.name,
      color: c.color,
      icon: c.icon,
      isDefault: c.isDefault
    }))
    window.api.config.syncCategories(configBaseName ?? dataset.name, configData)
  },

  addCategory: (name, color, icon) => {
    const { dataset } = get()
    if (!dataset) return
    const updated = CategoryService.create(dataset.categories, name, color, icon)
    set({ dataset: { ...dataset, categories: updated } })
    get().saveDatasetQueued()
    get().syncCategoriesConfig()
  },

  updateCategory: (id, updates) => {
    const { dataset } = get()
    if (!dataset) return
    const updated = CategoryService.update(dataset.categories, id, updates)
    set({ dataset: { ...dataset, categories: updated } })
    get().saveDatasetQueued()
    get().syncCategoriesConfig()
  },

  deleteCategory: (id, reassignToId) => {
    const { dataset } = get()
    if (!dataset) return
    const { updatedCategories } = CategoryService.delete(dataset.categories, id)
    const transactions = dataset.transactions.map((t) =>
      t.categoryId === id ? { ...t, categoryId: reassignToId } : t
    )
    const categoryTypeMap = { ...dataset.categoryTypeMap }
    delete categoryTypeMap[id]
    set({
      dataset: {
        ...dataset,
        categories: updatedCategories,
        transactions,
        categoryTypeMap
      }
    })
    get().saveDatasetQueued()
    get().syncCategoriesConfig()
  },

  updateCategoryTypeMap: (categoryId, type) => {
    const { dataset } = get()
    if (!dataset) return
    const categoryTypeMap = { ...dataset.categoryTypeMap }
    if (type === null) {
      delete categoryTypeMap[categoryId]
    } else {
      categoryTypeMap[categoryId] = type
    }
    set({ dataset: { ...dataset, categoryTypeMap } })
    get().saveDatasetQueued()
  },

  syncReceivablesConfig: () => {
    const { dataset, configBaseName } = get()
    if (!dataset) return
    const configData = dataset.receivables.map((r) => {
      const cat = dataset.categories.find((c) => c.id === r.categoryId)
      return {
        title: r.title,
        category: cat?.name ?? '',
        totalAmount: r.totalAmount,
        from: r.from,
        notes: r.notes
      }
    })
    window.api.config.syncReceivables(configBaseName ?? dataset.name, configData)
  },

  addReceivable: (data) => {
    const { dataset } = get()
    if (!dataset) return
    const updated = ReceivableService.create(dataset.receivables, data)
    set({ dataset: { ...dataset, receivables: updated } })
    get().saveDatasetQueued()
    get().syncReceivablesConfig()
  },

  updateReceivable: (id, updates) => {
    const { dataset } = get()
    if (!dataset) return
    const updated = ReceivableService.update(dataset.receivables, id, updates)
    set({ dataset: { ...dataset, receivables: updated } })
    get().saveDatasetQueued()
    get().syncReceivablesConfig()
  },

  deleteReceivable: (id) => {
    const { dataset } = get()
    if (!dataset) return
    const updated = ReceivableService.delete(dataset.receivables, id)
    set({ dataset: { ...dataset, receivables: updated } })
    get().saveDatasetQueued()
    get().syncReceivablesConfig()
  },

  setFilters: (filters) => set({ filters }),

  setSortConfig: (config) => set({ sortConfig: config }),

  setVisibleCards: (cards) => {
    set({ visibleCards: cards })
    get().updateSettings({ visibleDashboardCards: cards })
  },

  setLanguage: (language) => {
    set((state) => ({
      settings: { ...state.settings, language }
    }))
    get().saveSettings()
    if (typeof window !== 'undefined' && window.api?.menu) {
      window.api.menu.updateLanguage(language)
    }
  },

  updateSettings: (updates) => {
    set((state) => ({
      settings: { ...state.settings, ...updates }
    }))
    get().saveSettings()
  }
}))
