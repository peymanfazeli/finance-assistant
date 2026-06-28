import { Transaction, TransactionType, TransactionFilter, SortConfig } from '../models/types'
import { generateId } from '../utils/id'

export class TransactionService {
  static create(
    transactions: Transaction[],
    data: {
      date: string
      title: string
      categoryId: string
      type: TransactionType
      amount: number
      notes?: string
    }
  ): Transaction[] {
    const now = new Date().toISOString()
    const transaction: Transaction = {
      id: generateId(),
      date: data.date,
      title: data.title,
      categoryId: data.categoryId,
      type: data.type,
      amount: data.amount,
      notes: data.notes ?? '',
      createdAt: now,
      updatedAt: now
    }
    return [...transactions, transaction]
  }

  static update(
    transactions: Transaction[],
    id: string,
    updates: Partial<Pick<Transaction, 'date' | 'title' | 'categoryId' | 'type' | 'amount' | 'notes'>>
  ): Transaction[] {
    const now = new Date().toISOString()
    return transactions.map((t) =>
      t.id === id ? { ...t, ...updates, updatedAt: now } : t
    )
  }

  static delete(transactions: Transaction[], id: string): Transaction[] {
    return transactions.filter((t) => t.id !== id)
  }

  static duplicate(transactions: Transaction[], id: string): Transaction[] {
    const source = transactions.find((t) => t.id === id)
    if (!source) return transactions

    const now = new Date().toISOString()
    const duplicate: Transaction = {
      ...source,
      id: generateId(),
      title: source.title + ' (copy)',
      createdAt: now,
      updatedAt: now
    }
    return [...transactions, duplicate]
  }

  static search(transactions: Transaction[], keyword: string): Transaction[] {
    const lower = keyword.toLowerCase()
    return transactions.filter(
      (t) =>
        t.title.toLowerCase().includes(lower) || t.notes.toLowerCase().includes(lower)
    )
  }

  static filter(transactions: Transaction[], filter: TransactionFilter): Transaction[] {
    return transactions.filter((t) => {
      if (filter.keyword) {
        const lower = filter.keyword.toLowerCase()
        if (!t.title.toLowerCase().includes(lower) && !t.notes.toLowerCase().includes(lower)) {
          return false
        }
      }
      if (filter.dateFrom && t.date < filter.dateFrom) return false
      if (filter.dateTo && t.date > filter.dateTo) return false
      if (filter.categoryIds && filter.categoryIds.length > 0 && !filter.categoryIds.includes(t.categoryId)) {
        return false
      }
      if (filter.types && filter.types.length > 0 && !filter.types.includes(t.type)) {
        return false
      }
      if (filter.amountMin !== undefined && t.amount < filter.amountMin) return false
      if (filter.amountMax !== undefined && t.amount > filter.amountMax) return false
      return true
    })
  }

  static sort(transactions: Transaction[], config: SortConfig): Transaction[] {
    const sorted = [...transactions]
    sorted.sort((a, b) => {
      let cmp = 0
      switch (config.field) {
        case 'date':
          cmp = a.date.localeCompare(b.date)
          break
        case 'title':
          cmp = a.title.localeCompare(b.title)
          break
        case 'amount':
          cmp = a.amount - b.amount
          break
        case 'type':
          cmp = a.type.localeCompare(b.type)
          break
        case 'categoryId':
          cmp = a.categoryId.localeCompare(b.categoryId)
          break
      }
      return config.direction === 'asc' ? cmp : -cmp
    })
    return sorted
  }

  static detectDuplicates(
    transactions: Transaction[],
    candidates: { date: string; title: string; type: TransactionType; amount: number }[]
  ): boolean[] {
    const existingSet = new Set(
      transactions.map((t) => `${t.date}|${t.title.toLowerCase()}|${t.type}|${t.amount}`)
    )
    return candidates.map((c) =>
      existingSet.has(`${c.date}|${c.title.toLowerCase()}|${c.type}|${c.amount}`)
    )
  }
}
