import { InstallmentStatus, Payable, PayableInstallment } from '../models/types'
import { generateId } from '../utils/id'
import {
  gregorianDateToJalali,
  getTodayJalali,
  jalaaliMonthLength,
  jalaliToGregorianDateStrFromParts
} from '../utils/jalali'

export type InstallmentFilter = 'all' | 'pending' | 'paid' | 'overdue'

export type InstallmentValidationCode = 'total' | 'count' | 'date' | 'amount' | 'balance'

export type InstallmentState = 'pending' | 'paid' | 'overdue'

export interface InstallmentRow {
  payableId: string
  payableTitle: string
  installment: PayableInstallment
  number: number
  count: number
  state: InstallmentState
}

export interface InstallmentSummary {
  dueThisMonth: number
  totalScheduled: number
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

function getRows(payables: Payable[], todayStr: string): InstallmentRow[] {
  const rows: InstallmentRow[] = []
  for (const payable of payables) {
    const installments = payable.installments ?? []
    installments.forEach((installment, index) => {
      let state: InstallmentState = 'pending'
      if (installment.status === InstallmentStatus.Paid) {
        state = 'paid'
      } else if (installment.dueDate < todayStr) {
        state = 'overdue'
      }
      rows.push({
        payableId: payable.id,
        payableTitle: payable.title,
        installment,
        number: index + 1,
        count: installments.length,
        state
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

  static getRows(payables: Payable[], today?: Date): InstallmentRow[] {
    const { dateStr } = getTodayStr(today)
    return getRows(payables, dateStr)
  }

  static getSummary(payables: Payable[], today?: Date): InstallmentSummary {
    const { dateStr, jy, jm } = getTodayStr(today)
    const rows = getRows(payables, dateStr)
    const pending = rows.filter((row) => row.state !== 'paid')
    let dueThisMonth = 0

    for (const row of pending) {
      try {
        const jalali = gregorianDateToJalali(row.installment.dueDate)
        if (jalali.jy === jy && jalali.jm === jm) dueThisMonth += row.installment.amount
      } catch {
        // Invalid dates are reported by validation and excluded from totals.
      }
    }

    return {
      dueThisMonth: roundAmount(dueThisMonth),
      totalScheduled: roundAmount(pending.reduce((sum, row) => sum + row.installment.amount, 0)),
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
