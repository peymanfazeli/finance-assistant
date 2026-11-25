import { InstallmentStatus, Payable, PayableInstallment, Transaction } from '../models/types'
import { PayableService } from './PayableService'
import { generateId } from '../utils/id'
import {
  gregorianDateToJalali,
  getTodayJalali,
  jalaaliMonthLength,
  jalaliToGregorianDateStrFromParts
} from '../utils/jalali'

export type InstallmentFilter = 'all' | 'pending' | 'partial' | 'paid' | 'overdue'

export type InstallmentValidationCode = 'total' | 'count' | 'date' | 'amount' | 'balance' | 'history' | 'paidAmount' | 'duplicate'

export type InstallmentState = 'pending' | 'partial' | 'paid' | 'overdue'

export interface InstallmentRow {
  payableId: string
  payableTitle: string
  installment: PayableInstallment
  number: number
  count: number
  state: InstallmentState
  paidAmount: number
  remainingAmount: number
  paidDate: string | null
}

export interface InstallmentSummary {
  dueThisMonth: number
  totalScheduled: number
  partialBalance: number
  overdueBalance: number
  currentMonthBalance: number
  rows: InstallmentRow[]
}

export interface InstallmentValidation {
  valid: boolean
  codes: InstallmentValidationCode[]
  difference: number
}

export const MAX_INSTALLMENTS = 60

const AMOUNT_FACTOR = 100

function roundAmount(value: number): number {
  return Math.round(value * AMOUNT_FACTOR) / AMOUNT_FACTOR
}

function isValidDate(dateStr: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return false
  try {
    gregorianDateToJalali(dateStr)
    return true
  } catch {
    return false
  }
}

function resolveArgs(
  todayOrTransactions?: Date | Transaction[],
  transactions: Transaction[] = []
): { today?: Date; transactions: Transaction[] } {
  if (Array.isArray(todayOrTransactions)) {
    return { transactions: todayOrTransactions }
  }
  return { today: todayOrTransactions, transactions }
}

function getRows(
  payables: Payable[],
  todayStr: string,
  transactions: Transaction[]
): InstallmentRow[] {
  const rows: InstallmentRow[] = []
  for (const payable of payables) {
    const installments = payable.installments ?? []
    installments.forEach((installment, index) => {
      const paidAmount = PayableService.getInstallmentNetPaid(payable, installment, transactions, payables)
      const remainingAmount = roundAmount(Math.max(0, installment.amount - paidAmount))
      let state: InstallmentState = 'pending'
      if (paidAmount >= installment.amount - 0.005 && installment.amount > 0) {
        state = 'paid'
      } else if (paidAmount > 0) {
        state = 'partial'
      } else if (installment.dueDate < todayStr) {
        state = 'overdue'
      }
      rows.push({
        payableId: payable.id,
        payableTitle: payable.title,
        installment,
        number: index + 1,
        count: installments.length,
        state,
        paidAmount,
        remainingAmount,
        paidDate: PayableService.getInstallmentPaidDate(payable, installment, transactions)
      })
    })
  }
  return rows.sort(
    (a, b) =>
      a.installment.dueDate.localeCompare(b.installment.dueDate) ||
      a.payableTitle.localeCompare(b.payableTitle)
  )
}

function getTodayStr(today?: Date): { dateStr: string; jy: number; jm: number } {
  const currentJalali = getTodayJalali()
  const dateStr = today
    ? `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
    : jalaliToGregorianDateStrFromParts(currentJalali.jy, currentJalali.jm, currentJalali.jd)
  const jalaliToday = gregorianDateToJalali(dateStr)
  return {
    dateStr,
    jy: jalaliToday.jy,
    jm: jalaliToday.jm
  }
}

function sumBalances(rows: InstallmentRow[]): number {
  return roundAmount(rows.reduce((sum, row) => sum + row.remainingAmount, 0))
}

export class PayableInstallmentService {
  static getInstallments(payable: Payable | null | undefined): PayableInstallment[] {
    return payable?.installments ?? []
  }

  static getScheduledTotal(installments: PayableInstallment[]): number {
    return roundAmount(installments.reduce((sum, item) => sum + item.amount, 0))
  }

  static distributeEvenly(total: number, count: number): number[] {
    if (!Number.isFinite(total) || !Number.isInteger(count) || count <= 0) return []
    const totalUnits = Math.round(total * AMOUNT_FACTOR)
    const baseUnits = Math.floor(totalUnits / count)
    return Array.from({ length: count }, (_, index) =>
      (index === count - 1 ? totalUnits - baseUnits * (count - 1) : baseUnits) / AMOUNT_FACTOR
    )
  }

  static nextJalaliMonthDate(dateStr: string): string {
    try {
      const jalali = gregorianDateToJalali(dateStr)
      const nextYear = jalali.jm === 12 ? jalali.jy + 1 : jalali.jy
      const nextMonth = jalali.jm === 12 ? 1 : jalali.jm + 1
      const day = Math.min(jalali.jd, jalaaliMonthLength(nextYear, nextMonth))
      return jalaliToGregorianDateStrFromParts(nextYear, nextMonth, day)
    } catch {
      const today = getTodayJalali()
      return jalaliToGregorianDateStrFromParts(today.jy, today.jm, 1)
    }
  }

  static createInstallments(
    total: number,
    count: number,
    firstDueDate?: string,
    now: string = new Date().toISOString()
  ): PayableInstallment[] {
    const amounts = PayableInstallmentService.distributeEvenly(total, count)
    let dueDate = firstDueDate && isValidDate(firstDueDate)
      ? firstDueDate
      : now.slice(0, 10)
    return amounts.map((amount) => {
      const installment: PayableInstallment = {
        id: generateId(),
        amount,
        dueDate,
        status: InstallmentStatus.Pending,
        createdAt: now,
        updatedAt: now
      }
      dueDate = PayableInstallmentService.nextJalaliMonthDate(dueDate)
      return installment
    })
  }

  static createSchedulePreservingIds(
    existing: PayableInstallment[],
    total: number,
    count: number,
    firstDueDate?: string,
    now: string = new Date().toISOString()
  ): PayableInstallment[] {
    const generated = PayableInstallmentService.createInstallments(total, count, firstDueDate, now)
    return generated.map((installment, index) =>
      existing[index]
        ? { ...installment, id: existing[index].id, status: existing[index].status, paidAt: existing[index].paidAt, createdAt: existing[index].createdAt }
        : installment
    )
  }

  static isEvenDistribution(installments: PayableInstallment[]): boolean {
    if (installments.length === 0) return true
    const even = PayableInstallmentService.distributeEvenly(
      PayableInstallmentService.getScheduledTotal(installments),
      installments.length
    )
    return even.every((amount, index) => Math.abs(amount - installments[index].amount) < 0.001)
  }

  static redistributeEvenly(installments: PayableInstallment[], total: number): PayableInstallment[] {
    const amounts = PayableInstallmentService.distributeEvenly(total, installments.length)
    return installments.map((installment, index) => ({ ...installment, amount: amounts[index] }))
  }

  static rebalanceAfterTotalChange(
    installments: PayableInstallment[],
    total: number
  ): PayableInstallment[] {
    if (installments.length === 0 || !PayableInstallmentService.isEvenDistribution(installments)) {
      return installments
    }
    return PayableInstallmentService.redistributeEvenly(installments, total)
  }

  static validateSchedule(total: number, installments: PayableInstallment[]): InstallmentValidation {
    const codes: InstallmentValidationCode[] = []
    if (!Number.isFinite(total) || total <= 0) codes.push('total')
    if (installments.length === 0 || installments.length > MAX_INSTALLMENTS) codes.push('count')
    if (installments.some((item) => !isValidDate(item.dueDate))) codes.push('date')
    if (installments.some((item) => !Number.isFinite(item.amount) || item.amount <= 0)) codes.push('amount')
    const difference = roundAmount(PayableInstallmentService.getScheduledTotal(installments) - (Number.isFinite(total) ? total : 0))
    if (installments.length > 0 && Math.abs(difference) >= 0.01) codes.push('balance')
    return { valid: codes.length === 0, codes, difference }
  }

  static validateScheduleEdit(
    payable: Payable,
    nextInstallments: PayableInstallment[],
    transactions: Transaction[],
    total: number = payable.totalAmount
  ): InstallmentValidation {
    const result = PayableInstallmentService.validateSchedule(total, nextInstallments)
    const ids = nextInstallments.map((item) => item.id)
    if (new Set(ids).size !== ids.length) result.codes.push('duplicate')

    for (const existing of payable.installments ?? []) {
      const paid = PayableService.getInstallmentNetPaid(payable, existing, transactions, [payable])
      const retained = nextInstallments.find((item) => item.id === existing.id)
      if (paid > 0 && !retained) {
        result.codes.push('history')
      } else if (retained && retained.amount < paid - 0.005) {
        result.codes.push('paidAmount')
      }
    }

    const priority: InstallmentValidationCode[] = ['history', 'paidAmount', 'duplicate', 'date', 'amount', 'balance', 'count', 'total']
    result.codes = Array.from(new Set(result.codes)).sort(
      (a, b) => priority.indexOf(a) - priority.indexOf(b)
    )
    result.valid = result.codes.length === 0
    return result
  }

  static getRows(payables: Payable[], today?: Date, transactions?: Transaction[]): InstallmentRow[]
  static getRows(payables: Payable[], transactions: Transaction[]): InstallmentRow[]
  static getRows(
    payables: Payable[],
    todayOrTransactions?: Date | Transaction[],
    transactions: Transaction[] = []
  ): InstallmentRow[] {
    const args = resolveArgs(todayOrTransactions, transactions)
    const { dateStr } = getTodayStr(args.today)
    return getRows(payables, dateStr, args.transactions)
  }

  static getSummary(payables: Payable[], today?: Date, transactions?: Transaction[]): InstallmentSummary
  static getSummary(payables: Payable[], transactions: Transaction[]): InstallmentSummary
  static getSummary(
    payables: Payable[],
    todayOrTransactions?: Date | Transaction[],
    transactions: Transaction[] = []
  ): InstallmentSummary {
    const args = resolveArgs(todayOrTransactions, transactions)
    const { dateStr, jy, jm } = getTodayStr(args.today)
    const rows = getRows(payables, dateStr, args.transactions)
    const pending = rows.filter((row) => row.state !== 'paid')
    let dueThisMonth = 0

    for (const row of pending) {
      try {
        const jalali = gregorianDateToJalali(row.installment.dueDate)
        if (jalali.jy === jy && jalali.jm === jm) dueThisMonth += row.remainingAmount
      } catch {
        dueThisMonth += 0
      }
    }

    return {
      dueThisMonth: roundAmount(dueThisMonth),
      totalScheduled: sumBalances(pending),
      partialBalance: sumBalances(rows.filter((row) => row.state === 'partial')),
      overdueBalance: sumBalances(rows.filter((row) => row.state === 'overdue')),
      currentMonthBalance: roundAmount(dueThisMonth),
      rows
    }
  }

  static filterRows(rows: InstallmentRow[], filter: InstallmentFilter): InstallmentRow[] {
    if (filter === 'all') return rows
    return rows.filter((row) => row.state === filter)
  }

  static updateInstallment(
    payables: Payable[],
    payableId: string,
    installmentId: string,
    updates: Partial<Pick<PayableInstallment, 'amount' | 'dueDate'>>,
    now: string = new Date().toISOString()
  ): Payable[] {
    return payables.map((payable) =>
      payable.id === payableId
        ? {
            ...payable,
            updatedAt: now,
            installments: (payable.installments ?? []).map((installment) =>
              installment.id === installmentId ? { ...installment, ...updates, updatedAt: now } : installment
            )
          }
        : payable
    )
  }

  static setInstallmentPaid(
    payables: Payable[],
    payableId: string,
    installmentId: string,
    paid: boolean,
    now: string = new Date().toISOString()
  ): Payable[] {
    return payables.map((payable) =>
      payable.id === payableId
        ? {
            ...payable,
            updatedAt: now,
            installments: (payable.installments ?? []).map((installment) =>
              installment.id === installmentId
                ? {
                    ...installment,
                    status: paid ? InstallmentStatus.Paid : InstallmentStatus.Pending,
                    paidAt: paid ? now : undefined,
                    updatedAt: now
                  }
                : installment
            )
          }
        : payable
    )
  }
}
