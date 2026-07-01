import { describe, it, expect } from 'vitest'
import {
  formatCurrency,
  formatDate,
  formatPersianDate,
  toPersianDigits
} from '../../src/core/utils/format'

describe('formatCurrency', () => {
  it('formats USD', () => {
    expect(formatCurrency(1234.5, 'USD')).toMatch(/\$/)
    expect(formatCurrency(1234.5, 'USD')).toMatch(/1,234/)
  })

  it('formats EUR', () => {
    expect(formatCurrency(99.99, 'EUR')).toMatch(/99/)
  })

  it('formats Toman', () => {
    const result = formatCurrency(100000, 'toman')
    expect(result).toMatch(/100/)
    expect(result).toMatch(/toman/)
  })
})

describe('formatDate', () => {
  it('formats a date string in en-US', () => {
    const result = formatDate('2026-06-15')
    expect(result).toMatch(/Jun/)
    expect(result).toMatch(/15/)
    expect(result).toMatch(/2026/)
  })
})

describe('formatPersianDate', () => {
  it('formats a date string in fa-IR', () => {
    const result = formatPersianDate('2026-06-15')
    expect(result).toMatch(/۱۴۰۵/)
  })
})

describe('toPersianDigits', () => {
  it('converts digits to Persian', () => {
    expect(toPersianDigits(1234567890)).toBe('۱۲۳۴۵۶۷۸۹۰')
  })

  it('handles zero', () => {
    expect(toPersianDigits(0)).toBe('۰')
  })

  it('handles negative numbers', () => {
    expect(toPersianDigits(-42)).toBe('-۴۲')
  })
})
