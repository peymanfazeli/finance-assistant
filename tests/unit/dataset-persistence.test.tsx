import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import PayablePage from '../../src/renderer/pages/PayablePage'
import { useAppStore } from '../../src/core/store/useAppStore'
import { DatasetService } from '../../src/core/services/DatasetService'
import { PayableInstallmentService } from '../../src/core/services/PayableInstallmentService'
import {
  Dataset,
  InstallmentStatus,
  Payable,
  PayableInstallment,
  TransactionType
} from '../../src/core/models/types'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'en' }
  })
}))

const PATH = '/tmp/persistence.fina'
const OTHER_PATH = '/tmp/other.fina'
const NOW = '2026-02-01T10:00:00.000Z'

function makeInstallments(): PayableInstallment[] {
  return [
    {
      id: 'inst-1',
      amount: 40,
      dueDate: '2026-03-01',
      status: InstallmentStatus.Pending,
      createdAt: NOW,
      updatedAt: NOW
    },
    {
      id: 'inst-2',
      amount: 60,
      dueDate: '2026-04-01',
      status: InstallmentStatus.Pending,
      createdAt: NOW,
      updatedAt: NOW
    }
  ]
}

function makeDataset(name = 'Persistence'): Dataset {
  return DatasetService.create(name, 'USD', [])
}

function legacyDataset(): unknown {
  return {
    version: 4,
    name: 'Legacy',
    currency: 'USD',
    createdAt: NOW,
    updatedAt: NOW,
    transactions: [],
    categories: [],
    receivables: [],
    payables: [{
      id: 'legacy-payable',
      title: 'Legacy Rent',
      categoryId: 'cat-1',
      totalAmount: 100,
      to: 'Landlord',
      notes: '',
      createdAt: NOW,
      updatedAt: NOW
    }]
  }
}

const savedByPath = new Map<string, string>()
const datasetSave = vi.fn(async (path: string, content: string) => {
  savedByPath.set(path, content)
  return { success: true }
})
const settingsSave = vi.fn().mockResolvedValue({ success: true })
const invoke = vi.fn().mockResolvedValue({ success: true })

beforeAll(() => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn()
    }))
  })
})

beforeEach(async () => {
  await useAppStore.getState().flushDatasetSave()
  savedByPath.clear()
  datasetSave.mockClear()
  settingsSave.mockClear()
  invoke.mockClear()

  window.api = {
    invoke,
    dataset: { save: datasetSave },
    settings: { save: settingsSave }
  } as unknown as Window['api']

  useAppStore.setState({
    dataset: makeDataset(),
    datasetPath: PATH,
    configBaseName: 'persistence',
    settings: { ...useAppStore.getState().settings, lastOpenedDataset: PATH }
  })
})

async function closeAndReopen(): Promise<Dataset> {
  await useAppStore.getState().clearDataset()
  expect(useAppStore.getState().dataset).toBeNull()
  const content = savedByPath.get(PATH)
  expect(content).toBeDefined()
  const restored = DatasetService.deserialize(content as string)
  await useAppStore.getState().setDataset(restored, PATH)
  return restored
}

describe('native dataset payable persistence', () => {
  it('restores a payable without installments after an immediate close and reopen', async () => {
    useAppStore.getState().addPayable({
      title: 'Groceries',
      categoryId: 'cat-1',
      totalAmount: 25,
      to: 'Market',
      notes: 'weekly',
      dueDate: '2026-03-01'
    })

    const created = useAppStore.getState().dataset?.payables?.[0] as Payable
    const restored = await closeAndReopen()
    const loaded = restored.payables?.[0]

    expect(loaded).toEqual(created)
    expect(loaded?.title).toBe('Groceries')
    expect(loaded?.to).toBe('Market')
    expect(loaded?.notes).toBe('weekly')
    expect(loaded?.dueDate).toBe('2026-03-01')
  })

  it('restores every installment with unchanged ids, amounts, and due dates after an immediate close', async () => {
    const installments = makeInstallments()
    useAppStore.getState().addPayable({
      title: 'Laptop',
      categoryId: 'cat-1',
      totalAmount: 100,
      to: 'Store',
      notes: '',
      installments
    })

    const created = useAppStore.getState().dataset?.payables?.[0] as Payable
    const restored = await closeAndReopen()
    const loaded = restored.payables?.[0]

    expect(loaded?.id).toBe(created.id)
    expect(loaded?.installments).toHaveLength(2)
    expect(loaded?.installments).toEqual(installments)
    expect(loaded?.installments?.map((item) => item.id)).toEqual(['inst-1', 'inst-2'])
    expect(loaded?.installments?.map((item) => item.amount)).toEqual([40, 60])
    expect(loaded?.installments?.map((item) => item.dueDate)).toEqual(['2026-03-01', '2026-04-01'])
  })

  it('renders the restored payable on the Payables page', async () => {
    useAppStore.getState().addPayable({
      title: 'Laptop',
      categoryId: 'cat-1',
      totalAmount: 100,
      to: 'Store',
      notes: '',
      installments: makeInstallments()
    })

    await closeAndReopen()
    render(<PayablePage />)

    expect(screen.getAllByText('Laptop').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Store').length).toBeGreaterThan(0)
  })

  it('flushes the pending save before switching to another dataset', async () => {
    useAppStore.getState().addPayable({
      title: 'Pending Payable',
      categoryId: 'cat-1',
      totalAmount: 10,
      to: 'Vendor',
      notes: ''
    })

    await useAppStore.getState().setDataset(makeDataset('Other'), OTHER_PATH)

    expect(datasetSave).toHaveBeenCalledTimes(1)
    expect(datasetSave.mock.calls[0][0]).toBe(PATH)
    const saved = DatasetService.deserialize(savedByPath.get(PATH) as string)
    expect(saved.payables?.[0].title).toBe('Pending Payable')
    expect(useAppStore.getState().dataset?.name).toBe('Other')
  })

  it('keeps the current dataset open when a pending save fails', async () => {
    datasetSave.mockResolvedValueOnce({ success: false, error: 'disk full' })
    useAppStore.getState().addPayable({
      title: 'Unsafe Payable',
      categoryId: 'cat-1',
      totalAmount: 10,
      to: 'Vendor',
      notes: ''
    })

    await expect(useAppStore.getState().clearDataset()).rejects.toThrow('disk full')
    expect(useAppStore.getState().dataset).not.toBeNull()
    expect(useAppStore.getState().dataset?.payables?.[0].title).toBe('Unsafe Payable')
  })

  it('reopens an older dataset without installment data', async () => {
    const legacy = DatasetService.deserialize(JSON.stringify(legacyDataset()))
    await useAppStore.getState().setDataset(legacy, PATH)

    expect(legacy.version).toBe(5)
    expect(legacy.payables?.[0].title).toBe('Legacy Rent')
    expect(useAppStore.getState().dataset?.payables?.[0].installments).toEqual([])
  })

  it('restores an edited installment schedule with preserved installment IDs', async () => {
    useAppStore.getState().addPayable({
      title: 'Laptop',
      categoryId: 'cat-1',
      totalAmount: 100,
      to: 'Store',
      notes: '',
      installments: makeInstallments()
    })

    const payableId = useAppStore.getState().dataset?.payables?.[0].id as string
    const existing = useAppStore.getState().dataset?.payables?.[0].installments ?? []
    useAppStore.getState().updatePayable(payableId, {
      totalAmount: 120,
      installments: PayableInstallmentService.createSchedulePreservingIds(existing, 120, 2, '2026-05-01', NOW)
    })

    const restored = await closeAndReopen()
    const loaded = restored.payables?.[0]

    expect(loaded?.totalAmount).toBe(120)
    expect(loaded?.installments?.map((item) => item.id)).toEqual(['inst-1', 'inst-2'])
    expect(loaded?.installments?.map((item) => item.amount)).toEqual([60, 60])
  })

  it('restores a recorded payment linked to an installment', async () => {
    const installments = makeInstallments()
    useAppStore.getState().addPayable({
      title: 'Laptop',
      categoryId: 'cat-1',
      totalAmount: 100,
      to: 'Store',
      notes: '',
      installments
    })
    const payableId = useAppStore.getState().dataset?.payables?.[0].id as string
    useAppStore.getState().addTransaction({
      date: '2026-03-01',
      title: 'Installment 1',
      categoryId: 'cat-1',
      type: TransactionType.Expense,
      amount: 40,
      notes: '',
      payableId,
      installmentId: 'inst-1'
    })

    const restored = await closeAndReopen()
    const payment = restored.transactions.find((item) => item.title === 'Installment 1')

    expect(payment?.payableId).toBe(payableId)
    expect(payment?.installmentId).toBe('inst-1')
    expect(restored.payables?.[0].installments).toEqual(installments)
  })
})
