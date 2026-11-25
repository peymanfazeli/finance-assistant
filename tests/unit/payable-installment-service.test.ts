import { describe, it, expect } from 'vitest'
import { InstallmentStatus, Payable, Transaction, TransactionType } from '../../src/core/models/types'
import {
  PayableInstallmentService,
  InstallmentFilter
} from '../../src/core/services/PayableInstallmentService'
import { PayableService } from '../../src/core/services/PayableService'
import {
  jalaliToGregorianDateStrFromParts,
  jalaliToGregorian
} from '../../src/core/utils/jalali'

const NOW = '2026-02-01T10:00:00.000Z'

function dateFromJalali(jy: number, jm: number, jd: number): Date {
  const { gy, gm, gd } = jalaliToGregorian(jy, jm, jd)
  return new Date(gy, gm - 1, gd)
}

function jalaliDate(jy: number, jm: number, jd: number): string {
  return jalaliToGregorianDateStrFromParts(jy, jm, jd)
}

function makeInstallment(
  id: string,
  amount: number,
  dueDate: string,
  status: InstallmentStatus = InstallmentStatus.Pending
) {
  return {
    id,
    amount,
    dueDate,
    status,
    paidAt: status === InstallmentStatus.Paid ? '2026-02-20T10:00:00.000Z' : undefined,
    createdAt: NOW,
    updatedAt: NOW
  }
}

function makePayable(id: string, title: string, installments?: ReturnType<typeof makeInstallment>[], to = 'Landlord'): Payable {
  return {
    id,
    title,
    categoryId: 'cat-1',
    totalAmount: installments?.reduce((sum, item) => sum + item.amount, 0) ?? 100,
    to,
    notes: '',
    createdAt: NOW,
    updatedAt: NOW,
    ...(installments ? { installments } : {})
  }
}

function makeTransaction(
  id: string,
  amount: number,
  date: string,
  options: {
    payableId?: string
    installmentId?: string
    type?: TransactionType
    title?: string
    categoryId?: string
  } = {}
): Transaction {
  return {
    id,
    date,
    title: options.title ?? 'Payment to Landlord',
    categoryId: options.categoryId ?? 'cat-1',
    type: options.type ?? TransactionType.Expense,
    amount,
    notes: '',
    payableId: options.payableId,
    installmentId: options.installmentId,
    createdAt: NOW,
    updatedAt: NOW
  }
}

describe('PayableInstallmentService.distributeEvenly', () => {
  it('distributes amounts evenly and puts the rounding remainder in the last installment', () => {
    expect(PayableInstallmentService.distributeEvenly(100, 3)).toEqual([33.33, 33.33, 33.34])
    expect(PayableInstallmentService.distributeEvenly(120000000, 6)).toEqual([
      20000000, 20000000, 20000000, 20000000, 20000000, 20000000
    ])
  })

  it('never loses or invents money when rounding', () => {
    for (const total of [0.01, 10, 100.05, 999999.99]) {
      const amounts = PayableInstallmentService.distributeEvenly(total, 7)
      expect(amounts).toHaveLength(7)
      expect(PayableInstallmentService.getScheduledTotal(
        amounts.map((amount, i) => makeInstallment(String(i), amount, jalaliDate(1404, 11, 10)))
      )).toBeCloseTo(total, 2)
    }
  })

  it('returns no installments for invalid counts', () => {
    expect(PayableInstallmentService.distributeEvenly(100, 0)).toEqual([])
    expect(PayableInstallmentService.distributeEvenly(100, -2)).toEqual([])
    expect(PayableInstallmentService.distributeEvenly(100, 1.5)).toEqual([])
  })
})

describe('PayableInstallmentService.createInstallments', () => {
  it('creates pending installments scheduled on consecutive Jalali months', () => {
    const first = jalaliDate(1405, 1, 1)
    const installments = PayableInstallmentService.createInstallments(100, 3, first, NOW)

    expect(installments).toHaveLength(3)
    expect(installments.map((item) => item.amount)).toEqual([33.33, 33.33, 33.34])
    expect(installments.map((item) => item.dueDate)).toEqual([
      first,
      jalaliDate(1405, 2, 1),
      jalaliDate(1405, 3, 1)
    ])
    expect(installments.every((item) => item.status === InstallmentStatus.Pending)).toBe(true)
    expect(installments.every((item) => item.id && item.createdAt === NOW)).toBe(true)
  })

  it('clamps Jalali month lengths when the first due date is the 31st', () => {
    expect(PayableInstallmentService.nextJalaliMonthDate(jalaliDate(1405, 6, 31))).toBe(jalaliDate(1405, 7, 30))
  })
})

describe('PayableInstallmentService distribution changes', () => {
  it('rebalances schedules that are still evenly distributed', () => {
    const installments = PayableInstallmentService.createInstallments(100, 3, jalaliDate(1404, 11, 10), NOW)
    expect(PayableInstallmentService.isEvenDistribution(installments)).toBe(true)

    const rebalanced = PayableInstallmentService.rebalanceAfterTotalChange(installments, 200)
    expect(rebalanced.map((item) => item.amount)).toEqual([66.66, 66.66, 66.68])
    expect(rebalanced.map((item) => item.dueDate)).toEqual(installments.map((item) => item.dueDate))
  })

  it('preserves manually edited amounts when the total changes', () => {
    const installments = PayableInstallmentService.createInstallments(100, 2, jalaliDate(1404, 11, 10), NOW)
    const custom = [{ ...installments[0], amount: 70 }, installments[1]]

    expect(PayableInstallmentService.isEvenDistribution(custom)).toBe(false)
    expect(PayableInstallmentService.rebalanceAfterTotalChange(custom, 300)).toEqual(custom)
  })

  it('redistributes manually edited amounts on an explicit reset', () => {
    const installments = PayableInstallmentService.createInstallments(100, 3, jalaliDate(1404, 11, 10), NOW)
    const custom = installments.map((item, i) => ({ ...item, amount: i === 0 ? 90 : 5 }))
    const reset = PayableInstallmentService.redistributeEvenly(custom, 150)

    expect(reset.map((item) => item.amount)).toEqual([50, 50, 50])
    expect(reset.map((item) => item.id)).toEqual(custom.map((item) => item.id))
  })

  it('preserves existing installment ids when regenerating a schedule', () => {
    const existing = PayableInstallmentService.createInstallments(100, 2, jalaliDate(1404, 11, 10), NOW)
    const regenerated = PayableInstallmentService.createSchedulePreservingIds(existing, 200, 3, jalaliDate(1404, 11, 10), NOW)

    expect(regenerated.map((item) => item.id)).toEqual([
      existing[0].id,
      existing[1].id,
      expect.any(String)
    ])
    expect(PayableInstallmentService.getScheduledTotal(regenerated)).toBe(200)
  })
})

describe('PayableInstallmentService.validateSchedule', () => {
  it('accepts a balanced schedule', () => {
    const installments = PayableInstallmentService.createInstallments(100, 3, jalaliDate(1404, 11, 10), NOW)
    const result = PayableInstallmentService.validateSchedule(100, installments)
    expect(result.valid).toBe(true)
    expect(result.codes).toEqual([])
    expect(result.difference).toBe(0)
  })

  it('reports the exact remaining difference for unbalanced schedules', () => {
    const installments = [makeInstallment('1', 30, jalaliDate(1404, 11, 10))]
    const result = PayableInstallmentService.validateSchedule(100, installments)
    expect(result.valid).toBe(false)
    expect(result.codes).toContain('balance')
    expect(result.difference).toBe(-70)
  })

  it('reports invalid dates, amounts, totals and counts', () => {
    expect(PayableInstallmentService.validateSchedule(0, []).codes).toEqual(expect.arrayContaining(['total', 'count']))
    expect(PayableInstallmentService.validateSchedule(10, [makeInstallment('1', 10, 'not-a-date')]).codes).toContain('date')
    expect(PayableInstallmentService.validateSchedule(10, [makeInstallment('1', 0, jalaliDate(1404, 11, 10))]).codes).toContain('amount')
  })

  it('blocks removing or shrinking installments that have payment history', () => {
    const installments = [
      makeInstallment('i1', 50, jalaliDate(1404, 11, 1)),
      makeInstallment('i2', 50, jalaliDate(1404, 12, 1))
    ]
    const payable = makePayable('p1', 'Laptop', installments)
    const transactions = [makeTransaction('t1', 50, jalaliDate(1404, 11, 10), {
      payableId: 'p1',
      installmentId: 'i1'
    })]

    const removed = PayableInstallmentService.validateScheduleEdit(payable, [installments[1]], transactions, 100)
    expect(removed.codes).toContain('history')
    expect(removed.valid).toBe(false)

    const shrunk = PayableInstallmentService.validateScheduleEdit(
      payable,
      [{ ...installments[0], amount: 40 }, installments[1]],
      transactions,
      90
    )
    expect(shrunk.codes).toContain('paidAmount')
    expect(shrunk.valid).toBe(false)
  })
})

describe('PayableInstallmentService payment-derived state', () => {
  const today = dateFromJalali(1404, 11, 15)

  it('derives paid, partial, overdue and pending states from transactions', () => {
    const installments = [
      makeInstallment('i1', 20, jalaliDate(1404, 10, 1)),
      makeInstallment('i2', 30, jalaliDate(1404, 11, 10)),
      makeInstallment('i3', 40, jalaliDate(1404, 11, 20)),
      makeInstallment('i4', 10, jalaliDate(1405, 1, 1))
    ]
    const payable = makePayable('p1', 'Laptop', installments)
    const transactions = [
      makeTransaction('t1', 20, jalaliDate(1404, 11, 2), { payableId: 'p1', installmentId: 'i1' }),
      makeTransaction('t2', 10, jalaliDate(1404, 11, 3), { payableId: 'p1', installmentId: 'i2' }),
      makeTransaction('t3', 40, jalaliDate(1404, 11, 4), { payableId: 'p1', installmentId: 'i3' })
    ]
    const rows = PayableInstallmentService.getRows([payable], today, transactions)
    const byId = new Map(rows.map((row) => [row.installment.id, row]))

    expect(byId.get('i1')?.state).toBe('paid')
    expect(byId.get('i2')?.state).toBe('partial')
    expect(byId.get('i3')?.state).toBe('paid')
    expect(byId.get('i4')?.state).toBe('pending')
    expect(byId.get('i2')?.paidAmount).toBe(10)
    expect(byId.get('i2')?.remainingAmount).toBe(20)
    expect(byId.get('i3')?.paidDate).toBe(jalaliDate(1404, 11, 4))
  })

  it('subtracts refunds from installment paid amounts', () => {
    const installments = [makeInstallment('i1', 100, jalaliDate(1404, 11, 10))]
    const payable = makePayable('p1', 'Laptop', installments)
    const transactions = [
      makeTransaction('t1', 100, jalaliDate(1404, 11, 10), { payableId: 'p1', installmentId: 'i1' }),
      makeTransaction('t2', 40, jalaliDate(1404, 11, 11), {
        payableId: 'p1',
        installmentId: 'i1',
        type: TransactionType.Refund
      })
    ]
    const row = PayableInstallmentService.getRows([payable], today, transactions)[0]
    expect(row.state).toBe('partial')
    expect(row.paidAmount).toBe(60)
    expect(row.remainingAmount).toBe(40)
  })

  it('allocates legacy payments by due date order when there are no explicit links', () => {
    const installments = [
      makeInstallment('i1', 30, jalaliDate(1404, 10, 1)),
      makeInstallment('i2', 30, jalaliDate(1404, 11, 1))
    ]
    const payable = makePayable('p1', 'Laptop', installments)
    const transactions = [makeTransaction('t1', 45, jalaliDate(1404, 11, 5))]
    const rows = PayableInstallmentService.getRows([payable], today, transactions)

    expect(rows.map((row) => row.state)).toEqual(['paid', 'partial'])
    expect(rows.map((row) => row.paidAmount)).toEqual([30, 15])
  })

  it('does not count a legacy transaction when multiple payables match it', () => {
    const first = makePayable('p1', 'Rent', [], 'Landlord')
    const second = makePayable('p2', 'Rent 2', [], 'Landlord')
    const transactions = [makeTransaction('t1', 100, jalaliDate(1404, 11, 5))]

    expect(PayableService.getPaidAmount(first, transactions, [first, second])).toBe(0)
    expect(PayableService.getPaidAmount(second, transactions, [first, second])).toBe(0)
  })
})

describe('PayableInstallmentService summary', () => {
  const today = dateFromJalali(1404, 11, 15)

  it('sums only pending installments due in the current Jalali month', () => {
    const payable = makePayable('p1', 'Laptop', [
      makeInstallment('1', 20, jalaliDate(1404, 11, 10)),
      makeInstallment('2', 30, jalaliDate(1404, 10, 10)),
      makeInstallment('3', 40, jalaliDate(1404, 11, 20))
    ], 'Store')
    const transactions = [makeTransaction('t1', 40, jalaliDate(1404, 11, 9), {
      payableId: 'p1',
      installmentId: '3'
    })]
    const summary = PayableInstallmentService.getSummary([payable], today, transactions)

    expect(summary.dueThisMonth).toBe(20)
    expect(summary.totalScheduled).toBe(50)
    expect(summary.partialBalance).toBe(0)
    expect(summary.overdueBalance).toBe(50)
    expect(summary.currentMonthBalance).toBe(20)
  })

  it('includes overdue and future pending installments in the scheduled total', () => {
    const payables = [
      makePayable('p1', 'Laptop', [
        makeInstallment('1', 10, jalaliDate(1404, 10, 1)),
        makeInstallment('2', 25, jalaliDate(1405, 1, 1))
      ])
    ]
    const summary = PayableInstallmentService.getSummary(payables, today)
    expect(summary.dueThisMonth).toBe(0)
    expect(summary.totalScheduled).toBe(35)
    expect(summary.rows.map((row) => row.state)).toEqual(['overdue', 'pending'])
  })

  it('sorts all installments by due date and identifies payable context', () => {
    const payables = [
      makePayable('p1', 'Car', [makeInstallment('1', 10, jalaliDate(1404, 11, 20))]),
      makePayable('p2', 'Laptop', [makeInstallment('2', 20, jalaliDate(1404, 11, 5))])
    ]
    const rows = PayableInstallmentService.getRows(payables, today)
    expect(rows.map((row) => row.payableTitle)).toEqual(['Laptop', 'Car'])
    expect(rows.map((row) => `${row.number}/${row.count}`)).toEqual(['1/1', '1/1'])
  })

  it('filters by pending, partial, paid and overdue state', () => {
    const payable = makePayable('p1', 'Laptop', [
      makeInstallment('1', 10, jalaliDate(1404, 10, 1)),
      makeInstallment('2', 20, jalaliDate(1404, 11, 20)),
      makeInstallment('3', 30, jalaliDate(1404, 11, 5))
    ])
    const transactions = [makeTransaction('t1', 30, jalaliDate(1404, 11, 6), {
      payableId: 'p1',
      installmentId: '3'
    })]
    const rows = PayableInstallmentService.getRows([payable], today, transactions)
    const states: Record<InstallmentFilter, string[]> = {
      all: ['overdue', 'paid', 'pending'],
      pending: ['pending'],
      partial: [],
      paid: ['paid'],
      overdue: ['overdue']
    }
    for (const [filter, expected] of Object.entries(states)) {
      expect(PayableInstallmentService.filterRows(rows, filter as InstallmentFilter).map((row) => row.state)).toEqual(expected)
    }
  })

  it('handles empty schedules and legacy payables without an installment array', () => {
    const payables: Payable[] = [
      makePayable('legacy', 'Old debt'),
      makePayable('empty', 'Empty schedule', [])
    ]
    expect(PayableInstallmentService.getSummary(payables, today)).toEqual({
      dueThisMonth: 0,
      totalScheduled: 0,
      partialBalance: 0,
      overdueBalance: 0,
      currentMonthBalance: 0,
      rows: []
    })
    expect(PayableInstallmentService.getInstallments(payables[0])).toEqual([])
  })
})

describe('PayableInstallmentService mutations', () => {
  it('updates amount and due date without touching other installments', () => {
    const payables = [
      makePayable('p1', 'Laptop', [
        makeInstallment('1', 10, jalaliDate(1404, 11, 1)),
        makeInstallment('2', 20, jalaliDate(1404, 12, 1))
      ])
    ]
    const updated = PayableInstallmentService.updateInstallment(
      payables,
      'p1',
      '2',
      { amount: 25, dueDate: jalaliDate(1405, 1, 1) },
      NOW
    )
    expect(updated[0].installments?.[1]).toMatchObject({
      amount: 25,
      dueDate: jalaliDate(1405, 1, 1),
      updatedAt: NOW
    })
    expect(updated[0].installments?.[0].amount).toBe(10)
  })

  it('retains the legacy manual paid mutation for stored payload compatibility', () => {
    const payables = [makePayable('p1', 'Laptop', [makeInstallment('1', 10, jalaliDate(1404, 11, 1))])]
    const paid = PayableInstallmentService.setInstallmentPaid(payables, 'p1', '1', true, NOW)
    expect(paid[0].installments?.[0]).toMatchObject({ status: InstallmentStatus.Paid, paidAt: NOW })

    const reverted = PayableInstallmentService.setInstallmentPaid(paid, 'p1', '1', false, NOW)
    expect(reverted[0].installments?.[0].status).toBe(InstallmentStatus.Pending)
    expect(reverted[0].installments?.[0].paidAt).toBeUndefined()
  })
})
