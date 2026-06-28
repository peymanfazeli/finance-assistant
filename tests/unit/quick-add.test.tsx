import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import QuickAdd from '../../src/renderer/components/QuickAdd'
import { Category } from '../../src/core/models/types'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => (key === 'transaction.quickAdd' ? 'Quick Add' : key) })
}))

const categories: Category[] = [
  { id: '1', name: 'Food', color: '#f00', icon: 'restaurant', isDefault: true, createdAt: '' }
]

describe('QuickAdd', () => {
  it('renders input and button', () => {
    render(<QuickAdd categories={categories} onAdd={() => {}} />)
    expect(screen.getByText('Quick Add')).toBeDefined()
  })

  it('calls onAdd with parsed amount', () => {
    const onAdd = vi.fn()
    render(<QuickAdd categories={categories} onAdd={onAdd} />)
    const input = screen.getByPlaceholderText('0.00')
    fireEvent.change(input, { target: { value: '50' } })
    fireEvent.click(screen.getByText('Quick Add'))
    expect(onAdd).toHaveBeenCalledWith(50, '1', '')
  })
})
