import { Transaction, TransactionType, Category } from '../models/types'
import { ReportDataPoint, TimeSeriesPoint } from './ReportService'
import { formatCurrency } from '../utils/format'
import * as XLSX from 'xlsx'
import { jsPDF } from 'jspdf'

function csvEscape(value: string | number): string {
  const str = String(value)
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return '"' + str.replace(/"/g, '""') + '"'
  }
  return str
}

export class ExportService {
  static toTransactionCSV(transactions: Transaction[], categories: Category[]): string {
    const catMap = new Map(categories.map((c) => [c.id, c.name]))
    const header = 'Date,Title,Category,Type,Amount,Notes\n'
    const rows = transactions
      .map((t) => {
        const catName = catMap.get(t.categoryId) || 'Other'
        return [
          csvEscape(t.date),
          csvEscape(t.title),
          csvEscape(catName),
          csvEscape(t.type),
          csvEscape(t.amount),
          csvEscape(t.notes)
        ].join(',')
      })
      .join('\n')
    return header + rows
  }
  static toCSV(data: (ReportDataPoint | TimeSeriesPoint)[], filename = 'report.csv'): string {
    const hasDate = data.length > 0 && 'date' in data[0]
    if (data.length === 0) return ''
    const hasIncome = hasDate && 'income' in data[0]
    const header = hasDate
      ? hasIncome
        ? 'Date,Income,Expense\n'
        : 'Date,Value\n'
      : 'Name,Value\n'
    const rows = data
      .map((row) => {
        if ('date' in row) {
          if (hasIncome) return `${row.date},${row.income},${row.expense}`
          return `${row.date},${row.expense}`
        }
        return `"${row.name}",${row.value}`
      })
      .join('\n')
    return header + rows
  }

  static toExcelBase64(data: (ReportDataPoint | TimeSeriesPoint)[]): string {
    const hasDate = data.length > 0 && 'date' in data[0]
    const hasIncome = hasDate && 'income' in data[0]
    if (hasDate) {
      const series = data as TimeSeriesPoint[]
      const rows = series.map((r) => {
        if (hasIncome) return { Date: r.date, Income: r.income, Expense: r.expense }
        return { Date: r.date, Value: r.expense }
      })
      return ExportService.jsonToXLSXBase64(rows)
    }
    const points = data as ReportDataPoint[]
    return ExportService.jsonToXLSXBase64(points.map((r) => ({ Name: r.name, Value: r.value })))
  }

  static toPDFBase64(
    data: (ReportDataPoint | TimeSeriesPoint)[],
    title = 'Report',
    chartImage?: string,
    currency = 'toman',
    locale = 'en-US'
  ): string {
    const doc = new jsPDF({ unit: 'mm', format: 'a4' })

    const hasDate = data.length > 0 && 'date' in data[0]
    const hasIncome = hasDate && 'income' in data[0]

    const totalValue = data.reduce((sum, row) => {
      return sum + ('value' in row ? (row as ReportDataPoint).value : (row as TimeSeriesPoint).expense)
    }, 0)
    const totalIncome = hasIncome
      ? data.reduce((sum, row) => sum + (row as TimeSeriesPoint).income, 0)
      : 0

    let yOffset = 0
    if (chartImage) {
      doc.addImage(chartImage, 'PNG', 14, 10, 180, 70)
      yOffset = 80
    }

    doc.setFontSize(18)
    doc.text(title, 14, 20 + yOffset)
    doc.setFontSize(10)
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 28 + yOffset)

    const headers = hasDate
      ? hasIncome
        ? ['Date', 'Income', 'Expense']
        : ['Date', 'Value']
      : ['Name', 'Value']

    const rows = data.map((row) => {
      if ('date' in row) {
        if (hasIncome) return [row.date, formatCurrency(row.income, currency, locale), formatCurrency(row.expense, currency, locale)]
        return [row.date, formatCurrency(row.expense, currency, locale)]
      }
      return [(row as ReportDataPoint).name, formatCurrency((row as ReportDataPoint).value, currency, locale)]
    })

    if (hasIncome) {
      rows.push(['Total', formatCurrency(totalIncome, currency, locale), formatCurrency(totalValue, currency, locale)])
    } else {
      rows.push(['Total', formatCurrency(totalValue, currency, locale)])
    }

    const colWidths = headers.map(() => 60)
    const startY = 36 + yOffset
    const rowHeight = 7

    headers.forEach((h, i) => {
      doc.setFontSize(10)
      doc.setFont(undefined, 'bold')
      doc.text(h, 14 + colWidths.slice(0, i).reduce((a, b) => a + b, 0) + 2, startY)
    })

    doc.line(14, startY + 1, 14 + colWidths.reduce((a, b) => a + b, 0), startY + 1)

    rows.forEach((row, ri) => {
      const y = startY + (ri + 1) * rowHeight
      if (y > 280) return
      doc.setFont(undefined, ri === rows.length - 1 ? 'bold' : 'normal')
      row.forEach((cell, ci) => {
        const x = 14 + colWidths.slice(0, ci).reduce((a, b) => a + b, 0) + 2
        doc.text(String(cell), x, y)
      })
    })

    return doc.output('datauristring').split(',')[1]
  }

  static toTransactionXLSXBase64(transactions: Transaction[], categories: Category[]): string {
    const catMap = new Map(categories.map((c) => [c.id, c.name]))
    const rows = transactions.map((t) => ({
      Date: t.date,
      Title: t.title,
      Category: catMap.get(t.categoryId) || 'Other',
      Type: t.type,
      Amount: t.amount,
      Notes: t.notes
    }))
    return ExportService.jsonToXLSXBase64(rows)
  }

  static validateData(data: (ReportDataPoint | TimeSeriesPoint)[]): boolean {
    return data.length > 0
  }

  private static jsonToXLSXBase64(json: Record<string, unknown>[]): string {
    const ws = XLSX.utils.json_to_sheet(json)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Report')
    const wbOut = XLSX.write(wb, { bookType: 'xlsx', type: 'base64' })
    return wbOut
  }
}
