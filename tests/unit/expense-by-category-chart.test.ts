import { describe, it, expect } from 'vitest'
import { buildCategoryPercentRows } from '../../src/renderer/components/ExpenseByCategoryChart'
import { ReportDataPoint } from '../../src/core/services/ReportService'

describe('buildCategoryPercentRows', () => {
  it('expresses each category expense as a percent of period income', () => {
    const points: ReportDataPoint[] = [
      { name: 'Food', value: 250, color: '#FF6B6B' },
      { name: 'Bills', value: 500, color: '#4ECDC4' }
    ]
    const rows = buildCategoryPercentRows(points, 1000)
    expect(rows.map((r) => [r.name, r.percent])).toEqual([
      ['Bills', 50],
      ['Food', 25]
    ])
    expect(rows[0].color).toBe('#4ECDC4')
  })

  it('sorts descending by amount', () => {
    const points: ReportDataPoint[] = [
      { name: 'A', value: 10 },
      { name: 'B', value: 30 },
      { name: 'C', value: 20 }
    ]
    expect(buildCategoryPercentRows(points, 100).map((r) => r.name)).toEqual(['B', 'C', 'A'])
  })

  it('returns nothing when period income is zero', () => {
    const points: ReportDataPoint[] = [{ name: 'Food', value: 250 }]
    expect(buildCategoryPercentRows(points, 0)).toEqual([])
    expect(buildCategoryPercentRows(points, -100)).toEqual([])
  })
})
