import { beforeAll, describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import SummaryCard from '../../src/renderer/components/SummaryCard'

beforeAll(() => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockReturnValue({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn()
    })
  })
})

describe('SummaryCard', () => {
  it('renders title and value', () => {
    render(<SummaryCard title="Total Income" value="$1,000" />)
    expect(screen.getByText('Total Income')).toBeDefined()
    expect(screen.getByText('$1,000')).toBeDefined()
  })

  it('renders icon when provided', () => {
    render(<SummaryCard title="Test" value="$0" icon="💰" />)
    expect(screen.getByText('💰')).toBeDefined()
  })

  it('applies custom color to value', () => {
    render(<SummaryCard title="Test" value="$0" color="#ff0000" />)
    const valueEl = screen.getByText('$0')
    expect(valueEl.style.color).toBe('var(--pfa-text-primary)')
  })
})
