import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import SearchBar from '../../src/renderer/components/SearchBar'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => (key === 'common.search' ? 'Search' : key) })
}))

describe('SearchBar', () => {
  it('renders input', () => {
    render(<SearchBar onSearch={() => {}} />)
    expect(screen.getByPlaceholderText('Search...')).toBeDefined()
  })

  it('calls onSearch on input change', () => {
    const onSearch = vi.fn()
    render(<SearchBar onSearch={onSearch} />)
    fireEvent.change(screen.getByPlaceholderText('Search...'), { target: { value: 'test' } })
    expect(onSearch).toHaveBeenCalledWith('test')
  })
})
