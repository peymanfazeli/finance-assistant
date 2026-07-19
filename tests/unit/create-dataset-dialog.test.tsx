import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import CreateDatasetDialog from '../../src/renderer/components/CreateDatasetDialog'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const map: Record<string, string> = {
        'dataset.createTitle': 'Create New Dataset',
        'dataset.name': 'Dataset Name',
        'dataset.namePlaceholder': 'e.g. My Finances 2026',
        'dataset.currency': 'Currency',
        'common.cancel': 'Cancel',
        'common.create': 'Create'
      }
      return map[key] ?? key
    }
  })
}))

describe('CreateDatasetDialog', () => {
  it('renders when open', () => {
    render(<CreateDatasetDialog open={true} onClose={() => {}} onCreate={() => {}} />)
    expect(screen.getByText('Create New Dataset')).toBeDefined()
    expect(screen.getByText('Cancel')).toBeDefined()
    expect(screen.getByText('Create')).toBeDefined()
  })

  it('does not render when closed', () => {
    const { container } = render(
      <CreateDatasetDialog open={false} onClose={() => {}} onCreate={() => {}} />
    )
    expect(container.innerHTML).toBe('')
  })

  it('calls onCreate with name and currency', () => {
    const onCreate = vi.fn()
    render(<CreateDatasetDialog open={true} onClose={() => {}} onCreate={onCreate} />)
    const input = screen.getByPlaceholderText('e.g. My Finances 2026')
    fireEvent.change(input, { target: { value: 'Test Dataset' } })
    screen.getByText('Create').click()
    expect(onCreate).toHaveBeenCalledWith('Test Dataset', 'toman')
  })

  it('calls onClose when cancel clicked', () => {
    const onClose = vi.fn()
    render(<CreateDatasetDialog open={true} onClose={onClose} onCreate={() => {}} />)
    screen.getByText('Cancel').click()
    expect(onClose).toHaveBeenCalledOnce()
  })
})
