export enum TransactionType {
  Income = 'income',
  Expense = 'expense',
  Refund = 'refund',
  Investment = 'investment'
}

export enum Language {
  En = 'en',
  Fa = 'fa'
}

export interface Category {
  id: string
  name: string
  color: string
  icon: string
  isDefault: boolean
  createdAt: string
}

export interface Transaction {
  id: string
  date: string
  title: string
  categoryId: string
  type: TransactionType
  amount: number
  notes: string
  createdAt: string
  updatedAt: string
}

export interface Receivable {
  id: string
  title: string
  categoryId: string
  totalAmount: number
  from: string
  notes: string
  askDate?: string
  createdAt: string
  updatedAt: string
}

export interface Dataset {
  version: number
  name: string
  currency: string
  createdAt: string
  updatedAt: string
  transactions: Transaction[]
  categories: Category[]
  receivables: Receivable[]
}

export interface ApplicationSettings {
  language: Language
  visibleDashboardCards: string[]
  lastOpenedDataset: string | null
  recentDatasets: string[]
  lastExportTimestamp: string | null
}

export type TransactionFilter = {
  keyword?: string
  dateFrom?: string
  dateTo?: string
  categoryIds?: string[]
  types?: TransactionType[]
  amountMin?: number
  amountMax?: number
}

export type SortConfig = {
  field: 'date' | 'title' | 'amount' | 'type' | 'categoryId'
  direction: 'asc' | 'desc'
}

export type DashboardCardId =
  | 'totalIncome'
  | 'totalExpenses'
  | 'netBalance'
  | 'transactionCount'
  | 'avgDailySpending'
  | 'avgWeeklySpending'
