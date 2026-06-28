import { Transaction, TransactionType, Category } from '../models/types'

export interface ReportDataPoint {
  name: string
  value: number
  color?: string
}

export interface TimeSeriesPoint {
  date: string
  income: number
  expense: number
}

export type ReportType =
  | 'expenseByCategory'
  | 'incomeByCategory'
  | 'dailySpending'
  | 'weeklySpending'
  | 'monthlySpending'
  | 'incomeVsExpense'
  | 'topExpenses'
  | 'topIncome'
  | 'spendingTrends'
  | 'searchReport'

export type SearchGrouping = 'category' | 'month'

export type ChartType = 'line' | 'bar' | 'pie' | 'donut' | 'area'

export type Grouping = 'day' | 'week' | 'month' | 'year'
export type Aggregation = 'sum' | 'count' | 'avg'

export interface CustomReportQuery {
  dateFrom?: string
  dateTo?: string
  categoryIds?: string[]
  types?: string[]
  grouping: Grouping
  aggregation: Aggregation
}

export class ReportService {
  static generate(
    transactions: Transaction[],
    categories: Category[],
    reportType: ReportType,
    dateFrom?: string,
    dateTo?: string
  ): ReportDataPoint[] | TimeSeriesPoint[] {
    let filtered = transactions
    if (dateFrom) filtered = filtered.filter((t) => t.date >= dateFrom)
    if (dateTo) filtered = filtered.filter((t) => t.date <= dateTo)

    switch (reportType) {
      case 'expenseByCategory':
        return ReportService.groupByCategory(
          filtered.filter((t) => t.type === TransactionType.Expense),
          categories
        )
      case 'incomeByCategory':
        return ReportService.groupByCategory(
          filtered.filter((t) => t.type === TransactionType.Income),
          categories
        )
      case 'dailySpending':
        return ReportService.timeSeries(
          filtered.filter((t) => t.type === TransactionType.Expense),
          'day'
        )
      case 'weeklySpending':
        return ReportService.timeSeries(
          filtered.filter((t) => t.type === TransactionType.Expense),
          'week'
        )
      case 'monthlySpending':
        return ReportService.timeSeries(
          filtered.filter((t) => t.type === TransactionType.Expense),
          'month'
        )
      case 'incomeVsExpense':
        return ReportService.incomeVsExpenseTimeSeries(filtered)
      case 'topExpenses':
        return ReportService.topN(
          filtered.filter((t) => t.type === TransactionType.Expense),
          10
        )
      case 'topIncome':
        return ReportService.topN(
          filtered.filter((t) => t.type === TransactionType.Income),
          10
        )
      case 'spendingTrends':
        return ReportService.timeSeries(
          filtered.filter((t) => t.type === TransactionType.Expense),
          'month'
        )
      default:
        return []
    }
  }

  static generateCustom(
    transactions: Transaction[],
    query: CustomReportQuery
  ): TimeSeriesPoint[] {
    let filtered = [...transactions]

    if (query.dateFrom) filtered = filtered.filter((t) => t.date >= query.dateFrom!)
    if (query.dateTo) filtered = filtered.filter((t) => t.date <= query.dateTo!)
    if (query.categoryIds && query.categoryIds.length > 0)
      filtered = filtered.filter((t) => query.categoryIds!.includes(t.categoryId))
    if (query.types && query.types.length > 0)
      filtered = filtered.filter((t) => query.types!.includes(t.type))

    const groups = new Map<string, number[]>()
    filtered.forEach((t) => {
      let key: string
      if (query.grouping === 'year') {
        key = t.date.slice(0, 4)
      } else {
        key = ReportService.truncateDate(t.date, query.grouping as 'day' | 'week' | 'month')
      }
      const vals = groups.get(key) || []
      vals.push(t.amount)
      groups.set(key, vals)
    })

    return Array.from(groups.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, vals]) => {
        let value: number
        switch (query.aggregation) {
          case 'count':
            value = vals.length
            break
          case 'avg':
            value = vals.reduce((s, v) => s + v, 0) / vals.length
            break
          default:
            value = vals.reduce((s, v) => s + v, 0)
        }
        return {
          date,
          income: 0,
          expense: Math.round(value * 100) / 100
        }
      })
  }

  static generateSearch(
    transactions: Transaction[],
    categories: Category[],
    keyword: string,
    grouping: SearchGrouping,
    dateFrom?: string,
    dateTo?: string
  ): ReportDataPoint[] {
    const lower = keyword.toLowerCase()
    let filtered = transactions.filter((t) => {
      const matchesTitle = t.title.toLowerCase().includes(lower)
      const matchesNotes = t.notes?.toLowerCase().includes(lower)
      const cat = categories.find((c) => c.id === t.categoryId)
      const matchesCategory = cat?.name.toLowerCase().includes(lower)
      return matchesTitle || matchesNotes || matchesCategory
    })
    if (dateFrom) filtered = filtered.filter((t) => t.date >= dateFrom)
    if (dateTo) filtered = filtered.filter((t) => t.date <= dateTo)

    if (grouping === 'category') {
      return ReportService.groupByCategory(filtered, categories)
    }

    const groups = new Map<string, number>()
    filtered.forEach((t) => {
      const key = ReportService.truncateDate(t.date, 'month')
      groups.set(key, (groups.get(key) || 0) + t.amount)
    })
    return Array.from(groups.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([name, value]) => ({
        name,
        value: Math.round(value * 100) / 100,
      }))
  }

  private static groupByCategory(
    transactions: Transaction[],
    categories: Category[]
  ): ReportDataPoint[] {
    const catMap = new Map(categories.map((c) => [c.id, c]))
    const groups = new Map<string, number>()
    transactions.forEach((t) => {
      groups.set(t.categoryId, (groups.get(t.categoryId) || 0) + t.amount)
    })
    return Array.from(groups.entries()).map(([catId, value]) => ({
      name: catMap.get(catId)?.name ?? catId,
      value: Math.round(value * 100) / 100,
      color: catMap.get(catId)?.color
    }))
  }

  private static timeSeries(
    transactions: Transaction[],
    granularity: 'day' | 'week' | 'month'
  ): TimeSeriesPoint[] {
    const groups = new Map<string, number>()
    transactions.forEach((t) => {
      const key = ReportService.truncateDate(t.date, granularity)
      groups.set(key, (groups.get(key) || 0) + t.amount)
    })
    return Array.from(groups.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, value]) => ({
        date,
        income: 0,
        expense: Math.round(value * 100) / 100
      }))
  }

  private static incomeVsExpenseTimeSeries(
    transactions: Transaction[]
  ): TimeSeriesPoint[] {
    const groups = new Map<string, { income: number; expense: number }>()
    transactions.forEach((t) => {
      const key = ReportService.truncateDate(t.date, 'month')
      const entry = groups.get(key) || { income: 0, expense: 0 }
      if (t.type === TransactionType.Income) entry.income += t.amount
      else if (t.type === TransactionType.Expense) entry.expense += t.amount
      groups.set(key, entry)
    })
    return Array.from(groups.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, vals]) => ({
        date,
        income: Math.round(vals.income * 100) / 100,
        expense: Math.round(vals.expense * 100) / 100
      }))
  }

  private static topN(
    transactions: Transaction[],
    n: number
  ): ReportDataPoint[] {
    return [...transactions]
      .sort((a, b) => b.amount - a.amount)
      .slice(0, n)
      .map((t) => ({
        name: t.title,
        value: t.amount
      }))
  }

  private static truncateDate(dateStr: string, granularity: 'day' | 'week' | 'month'): string {
    const d = new Date(dateStr)
    if (granularity === 'day') return dateStr
    if (granularity === 'month') return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    const start = new Date(d)
    start.setDate(d.getDate() - d.getDay())
    return start.toISOString().split('T')[0]
  }
}
