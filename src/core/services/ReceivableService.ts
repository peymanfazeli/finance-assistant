import { Receivable, Transaction, TransactionType } from '../models/types'
import { generateId } from '../utils/id'

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
    return transactions.filter(
      (t) => t.categoryId === receivable.categoryId && (t.type === TransactionType.Income || t.type === TransactionType.Refund)
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
