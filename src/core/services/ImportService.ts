import { TransactionType } from '../models/types'
import { TransactionService } from './TransactionService'
import * as XLSX from 'xlsx'

export interface ImportedRow {
  date: string
  title: string
  category: string
  type: TransactionType
  amount: number
  notes: string
}

export interface ColumnMapping {
  sourceField: string
  targetField: 'date' | 'title' | 'category' | 'type' | 'amount' | 'notes'
}

export interface ImportPreview {
  columns: string[]
  rows: Record<string, string>[]
  suggestedMapping: ColumnMapping[]
}

export class ImportService {
  static parseCSV(content: string): ImportPreview {
    const lines = content.split('\n').filter((l) => l.trim())
    if (lines.length < 2) throw new Error('CSV must have a header row and at least one data row')

    const headers = ImportService.parseCSVLine(lines[0])
    const dataLines = lines.slice(1)
    const rows = dataLines.map((line) => {
      const values = ImportService.parseCSVLine(line)
      const row: Record<string, string> = {}
      headers.forEach((h, i) => {
        row[h] = values[i] ?? ''
      })
      return row
    })

    return {
      columns: headers,
      rows,
      suggestedMapping: ImportService.detectMapping(headers)
    }
  }

  static parseExcel(content: ArrayBuffer): ImportPreview {
    const workbook = XLSX.read(content, { type: 'array' })
    const sheetName = workbook.SheetNames[0]
    if (!sheetName) throw new Error('Excel file has no sheets')

    const sheet = workbook.Sheets[sheetName]
    const jsonData = XLSX.utils.sheet_to_json<Record<string, string>>(sheet, { defval: '' })

    if (jsonData.length === 0) throw new Error('Excel sheet is empty')

    const columns = Object.keys(jsonData[0])

    return {
      columns,
      rows: jsonData,
      suggestedMapping: ImportService.detectMapping(columns)
    }
  }

  private static detectMapping(columns: string[]): ColumnMapping[] {
    const keywordMap: Record<string, string[]> = {
      date: ['date', 'تاریخ', 'history'],
      title: ['title', 'description', 'desc', 'name', 'شرح', 'توضیحات'],
      category: ['category', 'cat', 'دسته', 'دسته‌بندی', 'group'],
      type: ['type', 'kind', 'نوع'],
      amount: ['amount', 'value', 'price', 'مبلغ', 'قیمت', 'ارزش'],
      notes: ['notes', 'note', 'comment', 'remark', 'یادداشت', 'توضیح']
    }

    return columns.map((col) => {
      const lower = col.toLowerCase().trim()
      for (const [field, keywords] of Object.entries(keywordMap)) {
        if (keywords.some((kw) => lower === kw)) {
          return { sourceField: col, targetField: field as ColumnMapping['targetField'] }
        }
      }
      return { sourceField: col, targetField: 'notes' }
    })
  }

  static applyMapping(
    rows: Record<string, string>[],
    mapping: ColumnMapping[]
  ): ImportedRow[] {
    return rows.map((row) => {
      const get = (field: string): string => {
        const map = mapping.find((m) => m.targetField === field)
        return map ? row[map.sourceField] ?? '' : ''
      }

      const amountStr = get('amount').replace(/[^0-9.]/g, '')
      const amount = parseFloat(amountStr) || 0
      const typeStr = get('type').toLowerCase()

      let type = TransactionType.Expense
      if (typeStr === 'income' || typeStr === 'درآمد') {
        type = TransactionType.Income
      } else if (typeStr === 'refund' || typeStr === 'بازگشت') {
        type = TransactionType.Refund
      } else if (typeStr === 'investment' || typeStr === 'سرمایه‌گذاری') {
        type = TransactionType.Investment
      }

      return {
        date: get('date'),
        title: get('title') || get('notes').substring(0, 50),
        category: get('category') || 'Other',
        type,
        amount,
        notes: get('notes')
      }
    })
  }

  static detectDuplicates(
    existingTransactions: { date: string; title: string; type: TransactionType; amount: number }[],
    imported: ImportedRow[]
  ): boolean[] {
    return TransactionService.detectDuplicates(
      existingTransactions.map((t) => ({
        id: '',
        date: t.date,
        title: t.title,
        categoryId: '',
        type: t.type,
        amount: t.amount,
        notes: '',
        createdAt: '',
        updatedAt: ''
      })),
      imported
    )
  }

  private static parseCSVLine(line: string): string[] {
    const result: string[] = []
    let current = ''
    let inQuotes = false

    for (let i = 0; i < line.length; i++) {
      const char = line[i]
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"'
          i++
        } else {
          inQuotes = !inQuotes
        }
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim())
        current = ''
      } else {
        current += char
      }
    }
    result.push(current.trim())
    return result
  }
}
