import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useAppStore } from '../../src/core/store/useAppStore'
import { Dataset, Payable, Transaction, TransactionType } from '../../src/core/models/types'
import { PayableInstallmentService } from '../../src/core/services/PayableInstallmentService'
import { DatasetService } from '../../src/core/services/DatasetService'
import { jalaliToGregorianDateStrFromParts } from '../../src/core/utils/jalali'

const NOW = '2026-02-01T10:00:00.000Z'
const DUE = jalaliToGregorianDateStrFromParts(1404, 11, 10)

function makePayable(): Payable {
  const installments = PayableInstallmentService.createInstallments(100, 2, DUE, NOW)
  return {
    id: 'payable-1',
    title: 'Laptop',
    categoryId: 'cat-1',
    totalAmount: 100,
    to: 'Store',
    notes: '',
    createdAt: NOW,
    updatedAt: NOW,
    installments
  }
}

function makeTransaction(overrides: Partial<Transaction> = {}): Transaction {
  return {
    id: 'tx-1',
    date: DUE,
    title: 'Laptop payment',
    categoryId: 'cat-1',
    type: TransactionType.Expense,
    amount: 50,
    notes: '',
    createdAt: NOW,
    updatedAt: NOW,
    ...overrides
  }
}

function makeDataset(): Dataset {
  return {
    version: 5,
    name: 'Test',
    currency: 'USD',
    createdAt: NOW,
    updatedAt: NOW,
    transactions: [],
    categories: [],
    receivables: [],
    payables: [makePayable()]
  }
}

const datasetSave = vi.fn().mockResolvedValue({ success: true })
const invoke = vi.fn().mockResolvedValue(undefined)

beforeEach(() => {
  datasetSave.mockClear()
  invoke.mockClear()

  window.api = {
    invoke,
    dataset: { save: datasetSave },
    settings: { save: vi.fn().mockResolvedValue({ success: true }) },
    config: {
      syncCategories: vi.fn().mockResolvedValue({ success: true }),
      syncReceivables: vi.fn().mockResolvedValue({ success: true })
    }
  } as unknown as Window['api']

  useAppStore.setState({
    dataset: makeDataset(),
    datasetPath: '/tmp/test.fina',
    configBaseName: 'test'
  })
})

describe('payable installment store actions', () => {
  it('updates an installment amount and queues a dataset save', async () => {
    const installmentId = useAppStore.getState().dataset!.payables![0].installments![0].id

    useAppStore.getState().updateInstallment('payable-1', installmentId, { amount: 60 })

    const saved = useAppStore.getState().dataset!.payables![0].installments!
    expect(saved[0].amount).toBe(60)
    expect(saved[1].amount).toBe(50)
    await vi.waitFor(() => expect(datasetSave).toHaveBeenCalledTimes(1))
    expect(invoke).toHaveBeenCalledWith('app:saveStarted')
    expect(invoke).toHaveBeenCalledWith('app:saveCompleted')
  })

  it('rejects reducing an installment below its paid amount', () => {
    const installmentId = useAppStore.getState().dataset!.payables![0].installments![0].id
    useAppStore.getState().addTransaction({
      date: DUE,
      title: 'Installment 1',
      categoryId: 'cat-1',
      type: TransactionType.Expense,
      amount: 50,
      notes: '',
      payableId: 'payable-1',
      installmentId
    })

    expect(() => useAppStore.getState().updateInstallment('payable-1', installmentId, { amount: 40 }))
      .toThrow('schedule:paidAmount')
  })

  it('rejects removing installments with payment history', () => {
    const installmentId = useAppStore.getState().dataset!.payables![0].installments![0].id
    useAppStore.getState().addTransaction({
      date: DUE,
      title: 'Installment 1',
      categoryId: 'cat-1',
      type: TransactionType.Expense,
      amount: 50,
      notes: '',
      payableId: 'payable-1',
      installmentId
    })

    expect(() => useAppStore.getState().updatePayable('payable-1', { installments: [] }))
      .toThrow('schedule:history')
  })

  it('rejects overpayments and allows refunds to reduce recorded payments', () => {
    const installmentId = useAppStore.getState().dataset!.payables![0].installments![0].id
    useAppStore.getState().addTransaction({
      date: DUE,
      title: 'Installment 1',
      categoryId: 'cat-1',
      type: TransactionType.Expense,
      amount: 50,
      notes: '',
      payableId: 'payable-1',
      installmentId
    })

    expect(() => useAppStore.getState().addTransaction({
      date: DUE,
      title: 'Installment 1',
      categoryId: 'cat-1',
      type: TransactionType.Expense,
      amount: 1,
      notes: '',
      payableId: 'payable-1',
      installmentId
    })).toThrow('payment:overpayment')

    useAppStore.getState().addTransaction({
      date: DUE,
      title: 'Refund',
      categoryId: 'cat-1',
      type: TransactionType.Refund,
      amount: 20,
      notes: '',
      payableId: 'payable-1',
      installmentId
    })
    const transaction = useAppStore.getState().dataset!.transactions!.find((item) => item.title === 'Refund')
    expect(transaction?.payableId).toBe('payable-1')
    expect(transaction?.installmentId).toBe(installmentId)
  })

  it('validates an edited payment using the remaining amount excluding itself', () => {
    const installmentId = useAppStore.getState().dataset!.payables![0].installments![0].id
    useAppStore.getState().addTransaction({
      date: DUE,
      title: 'Installment 1',
      categoryId: 'cat-1',
      type: TransactionType.Expense,
      amount: 50,
      notes: '',
      payableId: 'payable-1',
      installmentId
    })
    const tx = useAppStore.getState().dataset!.transactions![0]

    expect(() => useAppStore.getState().updateTransaction(tx.id, { amount: 51 }))
      .toThrow('payment:overpayment')
    expect(() => useAppStore.getState().updateTransaction(tx.id, { amount: 49 })).not.toThrow()
  })

  it('blocks deleting a payable that has explicit payment transactions', () => {
    const installmentId = useAppStore.getState().dataset!.payables![0].installments![0].id
    useAppStore.getState().addTransaction({
      date: DUE,
      title: 'Installment 1',
      categoryId: 'cat-1',
      type: TransactionType.Expense,
      amount: 50,
      notes: '',
      payableId: 'payable-1',
      installmentId
    })

    expect(() => useAppStore.getState().deletePayable('payable-1'))
      .toThrow('payable.deleteHasPayments')
  })

  it('keeps installments intact through dataset serialization', () => {
    const dataset = makeDataset()
    const restored = DatasetService.deserialize(DatasetService.serialize(dataset))
    expect(restored.payables?.[0].installments).toEqual(dataset.payables?.[0].installments)
  })

  it('persists installments passed through addPayable and updatePayable', async () => {
    const installments = PayableInstallmentService.createInstallments(75, 3, DUE, NOW)

    useAppStore.getState().addPayable({
      title: 'Rent',
      categoryId: 'cat-1',
      totalAmount: 75,
      to: 'Landlord',
      installments
    })
    expect(useAppStore.getState().dataset!.payables![1].installments).toEqual(installments)

    const existing = useAppStore.getState().dataset!.payables![0].installments!
    useAppStore.getState().updatePayable('payable-1', {
      installments: PayableInstallmentService.createSchedulePreservingIds(existing, 100, 1, DUE, NOW)
    })
    expect(useAppStore.getState().dataset!.payables![0].installments).toHaveLength(1)
    await vi.waitFor(() => expect(datasetSave).toHaveBeenCalled())
  })

  it('keeps legacy links out of the delete guard', () => {
    useAppStore.setState({
      dataset: {
        ...makeDataset(),
        transactions: [makeTransaction({ payableId: undefined, title: 'Landlord payment' })]
      }
    })

    expect(() => useAppStore.getState().deletePayable('payable-1')).not.toThrow()
  })
})
