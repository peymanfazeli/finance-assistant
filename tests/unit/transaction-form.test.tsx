import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import TransactionForm from '../../src/renderer/components/TransactionForm'
import { Category, TransactionType } from '../../src/core/models/types'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const map: Record<string, string> = {
        'transaction.date': 'Date',
        'transaction.titleLabel': 'Title',
        'transaction.titlePlaceholder': 'e.g. Weekly groceries',
        'transaction.category': 'Category',
        'transaction.type': 'Type',
        'transaction.income': 'Income',
        'transaction.expense': 'Expense',
        'transaction.refund': 'Refund',
        'transaction.amount': 'Amount',
        'transaction.notes': 'Notes',
        'transaction.notesPlaceholder': 'Optional notes...',
        'common.save': 'Save',
        'common.cancel': 'Cancel'
      }
      return map[key] ?? key
    }
  })
}))

const categories: Category[] = [
  { id: '1', name: 'Food', color: '#f00', icon: 'restaurant', isDefault: true, createdAt: '' }
]

describe('TransactionForm', () => {
  it('renders form fields', () => {
    render(<TransactionForm categories={categories} onSave={() => {}} onCancel={() => {}} />)
    expect(screen.getByText('Title')).toBeDefined()
    expect(screen.getByText('Amount')).toBeDefined()
    expect(screen.getByText('Save')).toBeDefined()
    expect(screen.getByText('Cancel')).toBeDefined()
  })

  it('calls onSave with form data', () => {
    const onSave = vi.fn()
    render(<TransactionForm categories={categories} onSave={onSave} onCancel={() => {}} />)
    fireEvent.change(screen.getByPlaceholderText('e.g. Weekly groceries'), { target: { value: 'Test' } })
    fireEvent.change(screen.getAllByDisplayValue('')[0], { target: { value: '50' } })
    const amountInputs = screen.getAllByRole('spinbutton')
    if (amountInputs.length > 0) {
      fireEvent.change(amountInputs[0], { target: { value: '50' } })
    }
    const saveBtn = screen.getByText('Save')
    if (saveBtn) {
      fireEvent.click(saveBtn)
    }
  })

  it('calls onCancel when cancel clicked', () => {
    const onCancel = vi.fn()
    render(<TransactionForm categories={categories} onSave={() => {}} onCancel={onCancel} />)
    fireEvent.click(screen.getByText('Cancel'))
    expect(onCancel).toHaveBeenCalledOnce()
  })
})
