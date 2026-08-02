import { describe, it, expect } from 'vitest'
import { resolveDashboardPeriod, isValidCustomRange, DashboardPeriod } from '../../src/core/utils/dashboardPeriod'
import { jalaliToGregorianDateStrFromParts, jalaaliMonthLength, JalaliDate } from '../../src/core/utils/jalali'

const TODAY: JalaliDate = { jy: 1404, jm: 11, jd: 15 }

function date(jy: number, jm: number, jd: number): string {
  return jalaliToGregorianDateStrFromParts(jy, jm, jd)
}

describe('resolveDashboardPeriod', () => {
  it('returns empty bounds for "all"', () => {
    expect(resolveDashboardPeriod({ preset: 'all' }, TODAY)).toEqual({})
  })

  it('bounds "today" to the current day', () => {
    const result = resolveDashboardPeriod({ preset: 'today' }, TODAY)
    expect(result).toEqual({ from: date(1404, 11, 15), to: date(1404, 11, 15) })
  })

  it('bounds "thisMonth" from the 1st of the month to today', () => {
    const result = resolveDashboardPeriod({ preset: 'thisMonth' }, TODAY)
    expect(result).toEqual({ from: date(1404, 11, 1), to: date(1404, 11, 15) })
  })

  it('bounds "thisYear" from Farvardin 1 to today', () => {
    const result = resolveDashboardPeriod({ preset: 'thisYear' }, TODAY)
    expect(result).toEqual({ from: date(1404, 1, 1), to: date(1404, 11, 15) })
  })

  it('bounds "lastMonth" to the full previous month', () => {
    const result = resolveDashboardPeriod({ preset: 'lastMonth' }, TODAY)
    expect(result).toEqual({ from: date(1404, 10, 1), to: date(1404, 10, jalaaliMonthLength(1404, 10)) })
  })

  it('wraps "lastMonth" to Dey of the previous year when in Farvardin', () => {
    const result = resolveDashboardPeriod({ preset: 'lastMonth' }, { jy: 1404, jm: 1, jd: 5 })
    expect(result).toEqual({ from: date(1403, 12, 1), to: date(1403, 12, jalaaliMonthLength(1403, 12)) })
  })

  it('bounds "thisQuarter" from the quarter start month to today', () => {
    const result = resolveDashboardPeriod({ preset: 'thisQuarter' }, TODAY)
    expect(result).toEqual({ from: date(1404, 10, 1), to: date(1404, 11, 15) })
  })

  it('bounds "thisWeek" from Saturday of the current week to today', () => {
    const result = resolveDashboardPeriod({ preset: 'thisWeek' }, TODAY)
    const now = new Date(date(1404, 11, 15))
    const weekday = (now.getDay() + 1) % 7
    const from = date(1404, 11, 15 - weekday)
    expect(result).toEqual({ from, to: date(1404, 11, 15) })
  })

  it('uses custom range bounds', () => {
    const period: DashboardPeriod = { preset: 'custom', customFrom: '2025-01-01', customTo: '2025-02-01' }
    expect(resolveDashboardPeriod(period, TODAY)).toEqual({ from: '2025-01-01', to: '2025-02-01' })
  })

  it('uses today when no date is provided', () => {
    const result = resolveDashboardPeriod({ preset: 'today' })
    expect(result.from).toBeDefined()
    expect(result.to).toBe(result.from)
  })
})

describe('isValidCustomRange', () => {
  it('accepts a valid range', () => {
    expect(isValidCustomRange({ preset: 'custom', customFrom: '2025-01-01', customTo: '2025-02-01' })).toBe(true)
  })

  it('rejects when from is after to', () => {
    expect(isValidCustomRange({ preset: 'custom', customFrom: '2025-02-01', customTo: '2025-01-01' })).toBe(false)
  })

  it('rejects when a bound is missing', () => {
    expect(isValidCustomRange({ preset: 'custom', customFrom: '2025-01-01' })).toBe(false)
    expect(isValidCustomRange({ preset: 'custom' })).toBe(false)
  })
})
