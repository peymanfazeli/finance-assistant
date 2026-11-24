import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import PayableForm, { PAYABLE_FORM_ID } from '../../src/renderer/components/PayableForm'
import { Category } from '../../src/core/models/types'

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

function renderForm(onSave = vi.fn()) {
  render(
    <>
      <PayableForm
        categories={categories}
        currency="USD"
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
})
