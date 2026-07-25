import { Receivable, Transaction, TransactionType } from '../models/types'
import { generateId } from '../utils/id'
import { gregorianDateToJalali } from '../utils/jalali'

function getReceivableMonth(dateStr: string): { jy: number; jm: number } | null {
  try {
    const j = gregorianDateToJalali(dateStr)
    return { jy: j.jy, jm: j.jm }
  } catch {
    return null
  }
}

function isInSameMonth(dateStr: string, target: { jy: number; jm: number }): boolean {
  try {
    const j = gregorianDateToJalali(dateStr)
    return j.jy === target.jy && j.jm === target.jm
  } catch {
    return false
  }
}

export class ReceivableService {
  static create(
    receivables: Receivable[],
    data: {
      title: string
      categoryId: string
      totalAmount: number
      from: string
      notes?: string
      askDate?: string
    }
  ): Receivable[] {
    const now = new Date().toISOString()
    const receivable: Receivable = {
      id: generateId(),
      title: data.title,
      categoryId: data.categoryId,
      totalAmount: data.totalAmount,
      from: data.from,
      notes: data.notes ?? '',
      askDate: data.askDate || undefined,
      createdAt: now,
      updatedAt: now
    }
    return [...receivables, receivable]
  }

  static update(
    receivables: Receivable[],
    id: string,
    updates: Partial<Pick<Receivable, 'title' | 'categoryId' | 'totalAmount' | 'from' | 'notes' | 'askDate'>>
  ): Receivable[] {
    const now = new Date().toISOString()
    return receivables.map((r) =>
      r.id === id ? { ...r, ...updates, updatedAt: now } : r
    )
  }

  static delete(receivables: Receivable[], id: string): Receivable[] {
    return receivables.filter((r) => r.id !== id)
  }

  static getLinkedTransactions(receivable: Receivable, transactions: Transaction[]): Transaction[] {
    const refDate = receivable.askDate || receivable.createdAt.slice(0, 10)
    const month = getReceivableMonth(refDate)
    const isIncomeType = (t: Transaction) => t.type === TransactionType.Income || t.type === TransactionType.Refund

    if (month) {
      return transactions.filter(
        (t) => t.categoryId === receivable.categoryId && isIncomeType(t) && isInSameMonth(t.date, month)
      )
    }
    return transactions.filter(
      (t) => t.categoryId === receivable.categoryId && isIncomeType(t)
    )
  }

  static getReceivedAmount(receivable: Receivable, transactions: Transaction[]): number {
    const linked = ReceivableService.getLinkedTransactions(receivable, transactions)
    return linked.reduce((sum, t) => sum + t.amount, 0)
  }

  static getRemainingAmount(receivable: Receivable, transactions: Transaction[]): number {
    return receivable.totalAmount - ReceivableService.getReceivedAmount(receivable, transactions)
  }

  static getPayDate(receivable: Receivable, transactions: Transaction[]): string | null {
    const remaining = ReceivableService.getRemainingAmount(receivable, transactions)
    if (remaining > 0) return null
    const linked = ReceivableService.getLinkedTransactions(receivable, transactions)
    if (linked.length === 0) return null
    return linked.reduce((latest, t) => t.date > latest ? t.date : latest, linked[0].date)
  }
}
