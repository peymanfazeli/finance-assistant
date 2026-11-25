import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import PayableForm, { PAYABLE_FORM_ID } from '../../src/renderer/components/PayableForm'
import {
  Category,
  InstallmentStatus,
  Payable,
  Transaction,
  TransactionType
} from '../../src/core/models/types'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    i18n: { language: 'en' },
    t: (key: string) => {
      const map: Record<string, string> = {
        'payable.titleLabel': 'Title',
        'payable.category': 'Category',
        'payable.to': 'To',
        'payable.totalAmount': 'Total Amount',
        'payable.dueDate': 'Due Date',
        'payable.notes': 'Notes',
        'payable.validationTitle': 'Missing Required Fields',
        'payable.validationMessage': 'Please fill in the following fields:',
        'installment.enable': 'Split into installments',
        'installment.count': 'Number of installments',
        'installment.countPlaceholder': 'e.g. 3',
        'installment.generate': 'Generate schedule',
        'installment.redistribute': 'Redistribute evenly',
        'installment.note': 'Tracked separately from transactions.',
        'installment.number': '#',
        'installment.amount': 'Amount',
        'installment.dueDate': 'Due date',
        'installment.status': 'Status',
        'installment.empty': 'No installments for this payable.',
        'installment.allocated': 'Allocated',
        'installment.remaining': 'Remaining to allocate',
        'installment.overAllocated': 'Over allocated by',
        'installment.balanced': 'Schedule is balanced',
        'installment.statePaid': 'Paid',
        'installment.statePending': 'Pending',
        'installment.errorBalance': 'Installment amounts must add up to the total amount',
        'installment.errorHistory': 'Installments with payment history cannot be removed',
        'installment.errorPaidAmount': 'An installment amount cannot be less than the amount already paid',
        'common.save': 'Save',
        'common.cancel': 'Cancel',
        'common.ok': 'OK'
      }
      return map[key] ?? key
    }
  })
}))

const categories: Category[] = [
  { id: 'cat-1', name: 'Bills', color: '#fff', icon: 'bill', isDefault: false, createdAt: '' }
]

function renderForm(onSave = vi.fn(), payable?: Payable, transactions: Transaction[] = []) {
  render(
    <>
      <PayableForm
        payable={payable}
        categories={categories}
        currency="USD"
        transactions={transactions}
        onSave={onSave}
      />
      <button type="submit" form={PAYABLE_FORM_ID}>Save</button>
    </>
  )
  return { onSave }
}

function fillBaseFields(): void {
  fireEvent.change(screen.getByLabelText('Title'), { target: { value: 'Laptop' } })
  fireEvent.change(screen.getByLabelText('To'), { target: { value: 'Store' } })
  fireEvent.change(screen.getByLabelText('Total Amount'), { target: { value: '100' } })
}

describe('PayableForm installments', () => {
  it('blocks saving an unbalanced schedule and saves after redistribution', () => {
    const { onSave } = renderForm()
    fillBaseFields()
    fireEvent.click(screen.getByLabelText('Split into installments'))

    fireEvent.change(screen.getByLabelText('Amount 1'), { target: { value: '60' } })
    fireEvent.click(screen.getByText('Save'))

    expect(onSave).not.toHaveBeenCalled()
    expect(screen.getByText('Installment amounts must add up to the total amount')).toBeDefined()

    fireEvent.click(screen.getByText('Redistribute evenly'))
    fireEvent.click(screen.getByText('Save'))

    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({
      title: 'Laptop',
      totalAmount: 100,
      installments: [expect.objectContaining({ amount: 100 })]
    }))
  })

  it('saves without installments when the toggle is off', () => {
    const { onSave } = renderForm()
    fillBaseFields()
    fireEvent.click(screen.getByText('Save'))

    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({
      installments: undefined
    }))
  })

  it('blocks editing an installment below its recorded payment', () => {
    const payable: Payable = {
      id: 'p1',
      title: 'Laptop',
      categoryId: 'cat-1',
      totalAmount: 100,
      to: 'Store',
      notes: '',
      createdAt: '2026-02-01T10:00:00.000Z',
      updatedAt: '2026-02-01T10:00:00.000Z',
      installments: [{
        id: 'i1',
        amount: 100,
        dueDate: '2026-02-10',
        status: InstallmentStatus.Pending,
        createdAt: '2026-02-01T10:00:00.000Z',
        updatedAt: '2026-02-01T10:00:00.000Z'
      }]
    }
    const transactions: Transaction[] = [{
      id: 't1',
      date: '2026-02-10',
      title: 'Installment 1',
      categoryId: 'cat-1',
      type: TransactionType.Expense,
      amount: 50,
      notes: '',
      payableId: 'p1',
      installmentId: 'i1',
      createdAt: '2026-02-01T10:00:00.000Z',
      updatedAt: '2026-02-01T10:00:00.000Z'
    }]
    const { onSave } = renderForm(vi.fn(), payable, transactions)

    fireEvent.change(screen.getByLabelText('Amount 1'), { target: { value: '40' } })
    fireEvent.click(screen.getByText('Save'))

    expect(onSave).not.toHaveBeenCalled()
    expect(screen.getByText('An installment amount cannot be less than the amount already paid')).toBeDefined()
  })
})
