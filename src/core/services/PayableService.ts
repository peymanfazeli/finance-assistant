import { Payable, Transaction, TransactionType } from '../models/types'
import { generateId } from '../utils/id'
import { gregorianDateToJalali } from '../utils/jalali'

function getPayableMonth(dateStr: string): { jy: number; jm: number } | null {
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

export class PayableService {
  static create(
    payables: Payable[],
    data: {
      title: string
      categoryId: string
      totalAmount: number
      to: string
      notes?: string
      dueDate?: string
    }
  ): Payable[] {
    const now = new Date().toISOString()
    const payable: Payable = {
      id: generateId(),
      title: data.title,
      categoryId: data.categoryId,
      totalAmount: data.totalAmount,
      to: data.to,
      notes: data.notes ?? '',
      dueDate: data.dueDate || undefined,
      createdAt: now,
      updatedAt: now
    }
    return [...payables, payable]
  }

  static update(
    payables: Payable[],
    id: string,
    updates: Partial<Pick<Payable, 'title' | 'categoryId' | 'totalAmount' | 'to' | 'notes' | 'dueDate'>>
  ): Payable[] {
    const now = new Date().toISOString()
    return payables.map((p) =>
      p.id === id ? { ...p, ...updates, updatedAt: now } : p
    )
  }

  static delete(payables: Payable[], id: string): Payable[] {
    return payables.filter((p) => p.id !== id)
  }

  static getLinkedTransactions(payable: Payable, transactions: Transaction[]): Transaction[] {
    const refDate = (payable as any).dueDate || payable.createdAt.slice(0, 10)
    const month = getPayableMonth(refDate)
    const isExpenseType = (t: Transaction) => t.type === TransactionType.Expense || t.type === TransactionType.Refund
    const payee = ((payable as any).to || '').toLowerCase().trim()
    const matchesPayee = (t: Transaction) => {
      if (!payee) return true
      const hay = `${t.title} ${t.notes}`.toLowerCase()
      return hay.includes(payee)
    }

    if (month) {
      return transactions.filter(
        (t) => t.categoryId === payable.categoryId && isExpenseType(t) && matchesPayee(t) && isInSameMonth(t.date, month)
      )
    }
    return transactions.filter(
      (t) => t.categoryId === payable.categoryId && isExpenseType(t) && matchesPayee(t)
    )
  }

  static getPaidAmount(payable: Payable, transactions: Transaction[]): number {
    const linked = PayableService.getLinkedTransactions(payable, transactions)
    return linked.reduce((sum, t) => sum + t.amount, 0)
  }

  static getRemainingAmount(payable: Payable, transactions: Transaction[]): number {
    return payable.totalAmount - PayableService.getPaidAmount(payable, transactions)
  }

  static getPaidDate(payable: Payable, transactions: Transaction[]): string | null {
    const remaining = PayableService.getRemainingAmount(payable, transactions)
    if (remaining > 0) return null
    const linked = PayableService.getLinkedTransactions(payable, transactions)
    if (linked.length === 0) return null
    return linked.reduce((latest, t) => t.date > latest ? t.date : latest, linked[0].date)
  }
}
