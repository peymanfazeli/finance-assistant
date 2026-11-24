import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useAppStore } from '../../src/core/store/useAppStore'
import { Dataset, InstallmentStatus, Payable } from '../../src/core/models/types'
import { PayableInstallmentService } from '../../src/core/services/PayableInstallmentService'
import { DatasetService } from '../../src/core/services/DatasetService'

const NOW = '2026-02-01T10:00:00.000Z'
const DUE = '2026-02-10'

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

function makeDataset(): Dataset {
  return {
    version: 4,
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

  it('marks an installment paid with a paidAt timestamp and queues a save', async () => {
    const installmentId = useAppStore.getState().dataset!.payables![0].installments![0].id

    useAppStore.getState().setInstallmentPaid('payable-1', installmentId, true)

    const installment = useAppStore.getState().dataset!.payables![0].installments![0]
    expect(installment.status).toBe(InstallmentStatus.Paid)
    expect(installment.paidAt).toBeTruthy()
    await vi.waitFor(() => expect(datasetSave).toHaveBeenCalled())
  })

  it('reverts a paid installment back to pending', async () => {
    const installmentId = useAppStore.getState().dataset!.payables![0].installments![0].id
    useAppStore.getState().setInstallmentPaid('payable-1', installmentId, true)
    useAppStore.getState().setInstallmentPaid('payable-1', installmentId, false)

    const installment = useAppStore.getState().dataset!.payables![0].installments![0]
    expect(installment.status).toBe(InstallmentStatus.Pending)
    expect(installment.paidAt).toBeUndefined()
    await vi.waitFor(() => expect(datasetSave).toHaveBeenCalled())
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

    useAppStore.getState().updatePayable('payable-1', { installments: [] })
    expect(useAppStore.getState().dataset!.payables![0].installments).toEqual([])
    await vi.waitFor(() => expect(datasetSave).toHaveBeenCalled())
  })
})
