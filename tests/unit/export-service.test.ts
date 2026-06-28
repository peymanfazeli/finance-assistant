import { describe, it, expect } from 'vitest'
import { ExportService } from '../../src/core/services/ExportService'
import { ReportDataPoint, TimeSeriesPoint } from '../../src/core/services/ReportService'

const points: ReportDataPoint[] = [
  { name: 'Food', value: 150 },
  { name: 'Transport', value: 80 }
]

const series: TimeSeriesPoint[] = [
  { date: '2026-01', income: 0, expense: 150 },
  { date: '2026-02', income: 0, expense: 80 }
]

const incomeSeries: TimeSeriesPoint[] = [
  { date: '2026-01', income: 5000, expense: 150 },
  { date: '2026-02', income: 3000, expense: 80 }
]

describe('ExportService', () => {
  describe('toCSV', () => {
    it('generates CSV for ReportDataPoint[]', () => {
      const csv = ExportService.toCSV(points)
      expect(csv).toContain('Name,Value')
      expect(csv).toContain('"Food",150')
      expect(csv).toContain('"Transport",80')
    })

  it('generates CSV for TimeSeriesPoint[]', () => {
    const csv = ExportService.toCSV(series)
    expect(csv).toContain('Date,Income,Expense')
    expect(csv).toContain('2026-01')
  })

    it('generates CSV with Income/Expense columns when income present', () => {
      const csv = ExportService.toCSV(incomeSeries)
      expect(csv).toContain('Date,Income,Expense')
      expect(csv).toContain('5000')
      expect(csv).toContain('3000')
    })

    it('returns empty string for empty data', () => {
      expect(ExportService.toCSV([])).toBe('')
    })
  })

  describe('toExcelBase64', () => {
    it('generates base64 xlsx for ReportDataPoint[]', () => {
      const result = ExportService.toExcelBase64(points)
      expect(typeof result).toBe('string')
      expect(result.length).toBeGreaterThan(0)
    })
  })

  describe('toPDFBase64', () => {
    it('generates base64 PDF for ReportDataPoint[]', () => {
      const result = ExportService.toPDFBase64(points, 'Test Report')
      expect(typeof result).toBe('string')
      expect(result.length).toBeGreaterThan(0)
    })

    it('generates PDF for TimeSeriesPoint[]', () => {
      const result = ExportService.toPDFBase64(series, 'Time Series')
      expect(typeof result).toBe('string')
      expect(result.length).toBeGreaterThan(0)
    })
  })

  describe('validateData', () => {
    it('returns true for non-empty data', () => {
      expect(ExportService.validateData(points)).toBe(true)
    })

    it('returns false for empty data', () => {
      expect(ExportService.validateData([])).toBe(false)
    })
  })
})
