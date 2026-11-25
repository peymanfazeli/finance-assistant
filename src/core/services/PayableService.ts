import { Payable, PayableInstallment, Transaction, TransactionType } from '../models/types'
import { generateId } from '../utils/id'
import { gregorianDateToJalali } from '../utils/jalali'

export type PaymentSource = 'explicit' | 'legacy' | 'none'

export type PaymentValidationCode =
  | 'payable'
  | 'installment'
  | 'type'
  | 'category'
  | 'amount'
  | 'overpayment'
  | 'refund'

export interface PaymentValidation {
  valid: boolean
  codes: PaymentValidationCode[]
}

const AMOUNT_FACTOR = 100

function roundAmount(value: number): number {
  return Math.round(value * AMOUNT_FACTOR) / AMOUNT_FACTOR
}

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

function isPaymentType(transaction: Transaction): boolean {
  return transaction.type === TransactionType.Expense || transaction.type === TransactionType.Refund
}

function signedAmount(transaction: Transaction): number {
  if (transaction.type === TransactionType.Expense) return transaction.amount
  if (transaction.type === TransactionType.Refund) return -transaction.amount
  return 0
}

function sumSigned(transactions: Transaction[]): number {
  return roundAmount(transactions.reduce((sum, transaction) => sum + signedAmount(transaction), 0))
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
      installments?: PayableInstallment[]
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
      installments: data.installments,
      createdAt: now,
      updatedAt: now
    }
    return [...payables, payable]
  }

  static update(
    payables: Payable[],
    id: string,
    updates: Partial<Pick<Payable, 'title' | 'categoryId' | 'totalAmount' | 'to' | 'notes' | 'dueDate' | 'installments'>>
  ): Payable[] {
    const now = new Date().toISOString()
    return payables.map((p) =>
      p.id === id ? { ...p, ...updates, updatedAt: now } : p
    )
  }

  static delete(payables: Payable[], id: string): Payable[] {
    return payables.filter((p) => p.id !== id)
  }

  private static matchesLegacy(payable: Payable, transaction: Transaction): boolean {
    if (!isPaymentType(transaction)) return false
    if (transaction.categoryId !== payable.categoryId) return false
    const payee = (payable.to || '').toLowerCase().trim()
    if (!payee) return false
    if (!`${transaction.title} ${transaction.notes}`.toLowerCase().includes(payee)) return false
    const month = getPayableMonth(payable.dueDate || payable.createdAt.slice(0, 10))
    if (!month) return true
    return isInSameMonth(transaction.date, month)
  }

  static getLegacyTransactions(
    payable: Payable,
    transactions: Transaction[],
    payables: Payable[] = []
  ): Transaction[] {
    const candidates = payables.length > 0 ? payables : [payable]
    return transactions.filter((transaction) => {
      if (!PayableService.matchesLegacy(payable, transaction)) return false
      const matches = candidates.filter((candidate) => PayableService.matchesLegacy(candidate, transaction))
      return matches.length === 1 && matches[0].id === payable.id
    })
  }

  static getExplicitTransactions(payable: Payable, transactions: Transaction[]): Transaction[] {
    const installmentIds = new Set((payable.installments ?? []).map((item) => item.id))
    return transactions.filter((t) => {
      if (t.payableId !== payable.id || !isPaymentType(t)) return false
      if (!t.installmentId) return true
      return installmentIds.has(t.installmentId)
    })
  }

  static getPaymentSource(
    payable: Payable,
    transactions: Transaction[],
    payables: Payable[] = []
  ): PaymentSource {
    if (PayableService.getExplicitTransactions(payable, transactions).length > 0) return 'explicit'
    if (PayableService.getLegacyTransactions(payable, transactions, payables).length > 0) return 'legacy'
    return 'none'
  }

  static getPaymentTransactions(
    payable: Payable,
    transactions: Transaction[],
    payables: Payable[] = []
  ): Transaction[] {
    const source = PayableService.getPaymentSource(payable, transactions, payables)
    if (source === 'explicit') return PayableService.getExplicitTransactions(payable, transactions)
    if (source === 'legacy') return PayableService.getLegacyTransactions(payable, transactions, payables)
    return []
  }

  static getPaidAmount(payable: Payable, transactions: Transaction[], payables: Payable[] = []): number {
    const net = sumSigned(PayableService.getPaymentTransactions(payable, transactions, payables))
    const bounded = Math.max(0, net)
    const total = Number.isFinite(payable.totalAmount) ? payable.totalAmount : bounded
    return roundAmount(Math.min(bounded, total))
  }

  static getRemainingAmount(payable: Payable, transactions: Transaction[], payables: Payable[] = []): number {
    return roundAmount(Math.max(0, payable.totalAmount - PayableService.getPaidAmount(payable, transactions, payables)))
  }

  static getPaidDate(payable: Payable, transactions: Transaction[], payables: Payable[] = []): string | null {
    if (PayableService.getRemainingAmount(payable, transactions, payables) > 0) return null
    const payments = PayableService.getPaymentTransactions(payable, transactions, payables)
      .filter((t) => t.type === TransactionType.Expense)
    if (payments.length === 0) return null
    return payments.reduce((latest, t) => t.date > latest ? t.date : latest, payments[0].date)
  }

  static getInstallmentNetPaid(
    payable: Payable,
    installment: PayableInstallment,
    transactions: Transaction[],
    payables: Payable[] = []
  ): number {
    const explicit = PayableService.getExplicitTransactions(payable, transactions)
    if (explicit.length > 0) {
      const net = sumSigned(explicit.filter((t) => t.installmentId === installment.id))
      return roundAmount(Math.min(Math.max(0, net), Math.max(0, installment.amount)))
    }

    const legacyNet = sumSigned(PayableService.getLegacyTransactions(payable, transactions, payables))
    if (legacyNet <= 0) return 0
    let remaining = legacyNet
    const ordered = [...(payable.installments ?? [])].sort(
      (a, b) => a.dueDate.localeCompare(b.dueDate) || a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id)
    )
    for (const item of ordered) {
      const allocation = Math.min(Math.max(0, item.amount), remaining)
      if (item.id === installment.id) return roundAmount(allocation)
      remaining -= allocation
      if (remaining <= 0) break
    }
    return 0
  }

  static getInstallmentPaidDate(
    payable: Payable,
    installment: PayableInstallment,
    transactions: Transaction[]
  ): string | null {
    const payments = PayableService.getExplicitTransactions(payable, transactions).filter(
      (t) => t.installmentId === installment.id && t.type === TransactionType.Expense
    )
    if (payments.length === 0) return null
    return payments.reduce((latest, t) => t.date > latest ? t.date : latest, payments[0].date)
  }

  static hasPaymentHistory(payable: Payable, transactions: Transaction[]): boolean {
    return PayableService.getExplicitTransactions(payable, transactions).some(
      (t) => !!t.installmentId
    )
  }

  static canDelete(payable: Payable, transactions: Transaction[]): boolean {
    return PayableService.getExplicitTransactions(payable, transactions).length === 0
  }

  static validatePayment(
    data: {
      amount: number
      type: TransactionType
      categoryId: string
      payableId?: string
      installmentId?: string
    },
    payables: Payable[],
    transactions: Transaction[],
    excludeTransactionId?: string
  ): PaymentValidation {
    const codes: PaymentValidationCode[] = []
    if (!data.payableId) {
      return { valid: !data.installmentId, codes: data.installmentId ? ['payable'] : [] }
    }
    const payable = payables.find((p) => p.id === data.payableId)
    if (!payable) codes.push('payable')
    if (data.type !== TransactionType.Expense && data.type !== TransactionType.Refund) codes.push('type')
    if (!Number.isFinite(data.amount) || data.amount <= 0) codes.push('amount')
    if (data.categoryId !== payable?.categoryId) codes.push('category')

    let installment: PayableInstallment | undefined
    if (data.installmentId) {
      installment = payable?.installments?.find((item) => item.id === data.installmentId)
      if (!installment) codes.push('installment')
    }

    if (payable && installment && Number.isFinite(data.amount) && data.amount > 0) {
      const others = PayableService.getExplicitTransactions(payable, transactions).filter(
        (t) => t.id !== excludeTransactionId && t.installmentId === installment?.id
      )
      const existing = sumSigned(others)
      const signed = signedAmount({ type: data.type, amount: data.amount } as Transaction)
      const target = Math.max(0, installment.amount)
      const next = roundAmount(existing + signed)
      if (data.type === TransactionType.Expense && next > target) codes.push('overpayment')
      if (data.type === TransactionType.Refund && next < 0) codes.push('refund')
    } else if (payable && !data.installmentId && Number.isFinite(data.amount) && data.amount > 0) {
      const installments = payable.installments ?? []
      if (installments.length === 0) {
        const others = PayableService.getExplicitTransactions(payable, transactions).filter(
          (t) => t.id !== excludeTransactionId && !t.installmentId
        )
        const existing = sumSigned(others)
        const signed = signedAmount({ type: data.type, amount: data.amount } as Transaction)
        const next = roundAmount(existing + signed)
        if (data.type === TransactionType.Expense && next > Math.max(0, payable.totalAmount)) codes.push('overpayment')
        if (data.type === TransactionType.Refund && next < 0) codes.push('refund')
      } else {
        codes.push('installment')
      }
    }

    return { valid: codes.length === 0, codes: Array.from(new Set(codes)) }
  }
}
