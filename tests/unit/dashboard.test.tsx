import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import SummaryCard from '../../src/renderer/components/SummaryCard'

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
    expect(valueEl.style.color).toBe('rgb(255, 0, 0)')
  })
})
