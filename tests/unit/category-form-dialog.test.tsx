import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import CategoryFormDialog from '../../src/renderer/components/CategoryFormDialog'
import { Category } from '../../src/core/models/types'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const map: Record<string, string> = {
        'categories.add': 'Add Category',
        'categories.edit': 'Edit Category',
        'categories.name': 'Name',
        'categories.color': 'Color',
        'common.save': 'Save',
        'common.cancel': 'Cancel'
      }
      return map[key] ?? key
    }
  })
}))

const mockCategory: Category = {
  id: '1', name: 'Test', color: '#ff0000', icon: 'test', isDefault: false, createdAt: ''
}

describe('CategoryFormDialog', () => {
  it('renders add mode', () => {
    render(<CategoryFormDialog open={true} onSave={() => {}} onClose={() => {}} />)
    expect(screen.getByText('Add Category')).toBeDefined()
  })

  it('renders edit mode with category data', () => {
    render(<CategoryFormDialog open={true} category={mockCategory} onSave={() => {}} onClose={() => {}} />)
    expect(screen.getByText('Edit Category')).toBeDefined()
    const input = screen.getByDisplayValue('Test')
    expect(input).toBeDefined()
  })

  it('calls onSave with name and color', () => {
    const onSave = vi.fn()
    render(<CategoryFormDialog open={true} onSave={onSave} onClose={() => {}} />)
    fireEvent.change(screen.getByDisplayValue(''), { target: { value: 'New Cat' } })
    fireEvent.click(screen.getByText('Save'))
    expect(onSave).toHaveBeenCalled()
  })
})
