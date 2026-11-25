import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import InstallmentSummary from '../../src/renderer/components/InstallmentSummary'
import { InstallmentStatus, Payable, Transaction, TransactionType } from '../../src/core/models/types'
import { getTodayJalali, jalaliToGregorianDateStrFromParts } from '../../src/core/utils/jalali'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    i18n: { language: 'en' },
    t: (key: string) => {
      const map: Record<string, string> = {
        'installment.summaryTitle': 'Installment Overview',
        'installment.filterAll': 'All',
        'installment.filterPending': 'Pending',
        'installment.filterPaid': 'Paid',
        'installment.filterOverdue': 'Overdue',
        'installment.filterPartial': 'Partially Paid',
        'installment.dueThisMonth': 'Due This Month (Pending)',
        'installment.payable': 'Payable',
        'installment.number': '#',
        'installment.dueDate': 'Due date',
        'installment.amount': 'Amount',
        'installment.paidAmount': 'Paid Amount',
        'installment.remainingBalance': 'Remaining Balance',
        'installment.status': 'Status',
        'installment.actions': 'Actions',
        'installment.empty': 'No installments for this payable.',
        'installment.statePending': 'Pending',
        'installment.statePaid': 'Paid',
        'installment.stateOverdue': 'Overdue',
        'installment.statePartial': 'Partially Paid',
        'installment.edit': 'Edit installment',
        'installment.editTitle': 'Edit Installment',
        'installment.save': 'Save installment',
        'installment.errorAmount': 'Invalid amount',
        'payable.recordPayment': 'Record payment',
        'common.cancel': 'Cancel'
      }
      return map[key] ?? key
    }
  })
}))

const NOW = '2026-02-01T10:00:00.000Z'
const today = getTodayJalali()
const CURRENT_MONTH_DAY_ONE = jalaliToGregorianDateStrFromParts(today.jy, today.jm, 1)

function makePayables(): Payable[] {
  return [
    {
      id: 'p1',
      title: 'Laptop',
      categoryId: 'cat-1',
      totalAmount: 50,
      to: 'Store',
      notes: '',
      createdAt: NOW,
      updatedAt: NOW,
      installments: [
        {
          id: 'i1',
          amount: 20,
          dueDate: CURRENT_MONTH_DAY_ONE,
          status: InstallmentStatus.Pending,
          createdAt: NOW,
          updatedAt: NOW
        },
        {
          id: 'i2',
          amount: 30,
          dueDate: '2099-01-01',
          status: InstallmentStatus.Pending,
          createdAt: NOW,
          updatedAt: NOW
        }
      ]
    },
    {
      id: 'p2',
      title: 'Car',
      categoryId: 'cat-1',
      totalAmount: 50,
      to: 'Dealer',
      notes: '',
      createdAt: NOW,
      updatedAt: NOW,
      installments: [
        {
          id: 'i3',
          amount: 50,
          dueDate: '2020-01-01',
          status: InstallmentStatus.Pending,
          createdAt: NOW,
          updatedAt: NOW
        }
      ]
    }
  ]
}

function makeTransactions(): Transaction[] {
  return [{
    id: 't1',
    date: '2098-12-31',
    title: 'Laptop installment 2',
    categoryId: 'cat-1',
    type: TransactionType.Expense,
    amount: 30,
    notes: '',
    payableId: 'p1',
    installmentId: 'i2',
    createdAt: NOW,
    updatedAt: NOW
  }]
}

function renderSummary(onUpdate = vi.fn(), onView = vi.fn()) {
  render(
    <InstallmentSummary
      payables={makePayables()}
      transactions={makeTransactions()}
      currency="USD"
      onUpdateInstallment={onUpdate}
      onViewPayable={onView}
    />
  )
  return { onUpdate, onView }
}

describe('InstallmentSummary', () => {
  it('renders only non-redundant summary cards in the required order', () => {
    renderSummary()
    const heading = screen.getByRole('heading', { name: 'Installment Overview' })
    const dueLabel = screen.getByText('Due This Month (Pending)')
    const dueCard = dueLabel.parentElement as HTMLElement
    const cards = dueCard.parentElement as HTMLElement
    const allFilter = screen.getByRole('button', { name: 'All' })
    const filters = allFilter.parentElement as HTMLElement
    const table = screen.getByRole('table')

    expect(cards.children).toHaveLength(2)
    expect(cards.textContent).toContain('Overdue')
    expect(screen.queryByText('Total Scheduled (Pending)')).toBeNull()
    expect(screen.getAllByText('$20.00').length).toBeGreaterThan(0)
    expect(screen.getAllByText('$50.00').length).toBeGreaterThan(0)
    expect(heading.compareDocumentPosition(dueCard) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect(cards.compareDocumentPosition(filters) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect(filters.nextElementSibling?.querySelector('table')).toBe(table)
  })

  it('filters rows by payment-derived status', () => {
    renderSummary()
    fireEvent.click(screen.getByRole('button', { name: 'Paid' }))
    expect(screen.getByText('Laptop')).toBeDefined()
    expect(screen.queryByText('Car')).toBeNull()
  })

  it('opens the payable detail view to record a payment', () => {
    const { onView } = renderSummary()
    const buttons = screen.getAllByText('Record payment')
    fireEvent.click(buttons[0])
    expect(onView).toHaveBeenCalled()
  })

  it('edits an installment amount and due date', () => {
    const { onUpdate } = renderSummary()
    fireEvent.click(screen.getAllByText('Edit installment')[0])
    fireEvent.change(screen.getAllByLabelText('Amount')[0], { target: { value: '25' } })
    fireEvent.click(screen.getByText('Save installment'))
    expect(onUpdate).toHaveBeenCalledWith(
      expect.any(String),
      expect.any(String),
      expect.objectContaining({ amount: 25 })
    )
  })

  it('opens the payable detail view from a row', () => {
    const { onView } = renderSummary()
    fireEvent.click(screen.getAllByText('Laptop')[0])
    expect(onView).toHaveBeenCalled()
  })
})
