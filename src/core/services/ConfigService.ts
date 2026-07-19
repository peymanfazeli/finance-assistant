import { Category, Receivable, Transaction, TransactionType } from '../models/types'
import { generateId } from '../utils/id'
import { DEFAULT_CATEGORIES } from '../../Configs/def_cat'
import { DEFAULT_RECEIVABLES, ReceivableConfig } from '../../Configs/def_reciev'

export class ConfigService {
  static getCategories(): Category[] {
    const now = new Date().toISOString()
    return DEFAULT_CATEGORIES.map((cat) => ({
      ...cat,
      id: generateId(),
      createdAt: now
    }))
  }

  static getReceivables(categories: Category[]): Receivable[] {
    const now = new Date().toISOString()
    return DEFAULT_RECEIVABLES.map((rec) => {
      const matchedCategory = categories.find((c) => c.name === rec.category)
      return {
        id: generateId(),
        title: rec.title,
        categoryId: matchedCategory?.id ?? '',
        totalAmount: rec.totalAmount,
        from: rec.from,
        notes: rec.notes,
        createdAt: now,
        updatedAt: now
      }
    })
  }

  static parseTransactionsCSV(csvContent: string, categories: Category[]): Transaction[] {
    const lines = csvContent.split('\n').filter((l) => l.trim())
    if (lines.length < 2) return []

    const headers = lines[0].split(',').map((h) => h.trim())
    const now = new Date().toISOString()

    return lines.slice(1).map((line) => {
      const values = ConfigService.parseCSVLine(line)
      const row: Record<string, string> = {}
      headers.forEach((h, i) => {
        row[h] = values[i] ?? ''
      })

      const matchedCategory = categories.find(
        (c) => c.name.toLowerCase() === (row['Category'] ?? '').toLowerCase()
      )

      const typeStr = (row['Type'] ?? 'expense').toLowerCase() as string
      let type: TransactionType = TransactionType.Expense
      if (typeStr === 'income') type = TransactionType.Income
      else if (typeStr === 'refund') type = TransactionType.Refund
      else if (typeStr === 'investment') type = TransactionType.Investment

      return {
        id: generateId(),
        date: row['Date'] ?? new Date().toISOString().split('T')[0],
        title: row['Title'] ?? '',
        categoryId: matchedCategory?.id ?? categories[0]?.id ?? '',
        type,
        amount: parseFloat(row['Amount'] ?? '0') || 0,
        notes: row['Notes'] ?? '',
        createdAt: now,
        updatedAt: now
      }
    })
  }

  private static parseCSVLine(line: string): string[] {
    const result: string[] = []
    let current = ''
    let inQuotes = false

    for (let i = 0; i < line.length; i++) {
      const ch = line[i]
      if (inQuotes) {
        if (ch === '"') {
          if (i + 1 < line.length && line[i + 1] === '"') {
            current += '"'
            i++
          } else {
            inQuotes = false
          }
        } else {
          current += ch
        }
      } else {
        if (ch === '"') {
          inQuotes = true
        } else if (ch === ',') {
          result.push(current.trim())
          current = ''
        } else {
          current += ch
        }
      }
    }
    result.push(current.trim())
    return result
  }
}
