import { useState, useMemo, useRef, useCallback } from 'react'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { useAppStore } from '../../core/store/useAppStore'
import { ReportService, ReportType, ChartType, ReportDataPoint, TimeSeriesPoint, SearchGrouping } from '../../core/services/ReportService'
import ExportButton from '../components/ExportButton'
import AIAnalysisModal from '../components/AIAnalysisModal'
import { formatCurrency } from '../../core/utils/format'
import { colors, spacing, fontSize, fontWeight, borderRadius, padding, borderWidth } from '../../core/utils/styles'
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts'

const REPORTS: { id: ReportType; label: string }[] = [
  { id: 'expenseByCategory', label: 'Expense by Category' },
  { id: 'incomeByCategory', label: 'Income by Category' },
  { id: 'dailySpending', label: 'Daily Spending' },
  { id: 'weeklySpending', label: 'Weekly Spending' },
  { id: 'monthlySpending', label: 'Monthly Spending' },
  { id: 'incomeVsExpense', label: 'Income vs Expense' },
  { id: 'allByCategory', label: 'All by Category' },
  { id: 'topExpenses', label: 'Top Expenses' },
  { id: 'topIncome', label: 'Top Income' },
  { id: 'spendingTrends', label: 'Spending Trends' },
  { id: 'searchReport', label: 'Search Report' },
]

const CHART_TYPES: ChartType[] = ['line', 'bar', 'pie', 'donut', 'area']
const SEARCH_CHART_TYPES: ChartType[] = ['bar', 'line', 'area']

function ReportsPage(): JSX.Element {
  const { t, i18n } = useTranslation()
  const { dataset } = useAppStore()
  const locale = i18n.language === 'fa' ? 'fa-IR' : 'en-US'
  const currency = dataset?.currency || 'USD'
  const [selectedReport, setSelectedReport] = useState<ReportType>('expenseByCategory')
  const [chartType, setChartType] = useState<ChartType>('bar')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [searchKeyword, setSearchKeyword] = useState('')
  const [searchGrouping, setSearchGrouping] = useState<SearchGrouping>('category')
  const [searchGenerated, setSearchGenerated] = useState(false)
  const [showAIAnalysis, setShowAIAnalysis] = useState(false)

  const transactions = dataset?.transactions ?? []
  const categories = dataset?.categories ?? []

  const isSearch = selectedReport === 'searchReport'

  const data = useMemo(
    () => {
      if (isSearch) {
        if (!searchGenerated || !searchKeyword.trim()) return []
        return ReportService.generateSearch(transactions, categories, searchKeyword.trim(), searchGrouping, dateFrom || undefined, dateTo || undefined)
      }
      return ReportService.generate(transactions, categories, selectedReport, dateFrom || undefined, dateTo || undefined)
    },
    [transactions, categories, selectedReport, dateFrom, dateTo, isSearch, searchKeyword, searchGrouping, searchGenerated]
  )

  const chartRef = useRef<HTMLDivElement>(null)

  const isPie = chartType === 'pie' || chartType === 'donut'
  const points = data as ReportDataPoint[]
  const series = data as TimeSeriesPoint[]
  const hasData = data.length > 0
  const hasDate = hasData && 'date' in data[0]

  const pieData: ReportDataPoint[] | null = useMemo(() => {
    if (!isPie || !hasDate || isSearch) return null
    if (selectedReport === 'incomeVsExpense') {
      const s = data as TimeSeriesPoint[]
      const totalIncome = s.reduce((sum, point) => sum + (point.income ?? 0), 0)
      const totalExpense = s.reduce((sum, point) => sum + (point.expense ?? 0), 0)
      return [
        { name: 'Total Income', value: totalIncome },
        { name: 'Total Expense', value: totalExpense }
      ]
    }
    return ReportService.generate(
      transactions, categories, 'expenseByCategory',
      dateFrom || undefined, dateTo || undefined
    ) as ReportDataPoint[]
  }, [isPie, hasDate, selectedReport, data, transactions, categories, dateFrom, dateTo, isSearch])

  const handleSearch = useCallback(() => {
    setSearchGenerated(true)
  }, [])

  const renderChart = (): JSX.Element | null => {
    if (isSearch && !searchGenerated) {
      return <div style={styles.noData}>{t('reports.enterKeyword')}</div>
    }
    if (!hasData) {
      if (isSearch) return <div style={styles.noData}>{t('reports.noSearchResults')}</div>
      return <div style={styles.noData}>{t('reports.noData')}</div>
    }

    if (isPie) {
      const pd = pieData ?? points
      return (
        <ResponsiveContainer width="100%" height={350}>
          <PieChart>
            <Pie
              data={pd}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={120}
              innerRadius={chartType === 'donut' ? 60 : 0}
              label
            >
              {pd.map((_, i) => (
                <Cell key={i} fill={pd[i]?.color ?? colors.chart[i % colors.chart.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      )
    }

    if ('date' in (data[0] ?? {})) {
      const commonProps = { data: series, margin: { top: 10, right: 30, left: 0, bottom: 0 } }
      switch (chartType) {
        case 'line':
          return (
            <ResponsiveContainer width="100%" height={350}>
              <LineChart {...commonProps}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" fontSize={12} />
                <YAxis fontSize={12} />
                <Tooltip />
                <Legend />
                {'income' in series[0] ? (
                  <>
                    <Line type="monotone" dataKey="income" stroke={colors.success} name="Income" />
                    <Line type="monotone" dataKey="expense" stroke={colors.danger} name="Expense" />
                  </>
                ) : (
                  <Line type="monotone" dataKey="expense" stroke={colors.danger} name="Expense" />
                )}
              </LineChart>
            </ResponsiveContainer>
          )
        case 'area':
          return (
            <ResponsiveContainer width="100%" height={350}>
              <AreaChart {...commonProps}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" fontSize={12} />
                <YAxis fontSize={12} />
                <Tooltip />
                <Legend />
                {'income' in series[0] ? (
                  <>
                    <Area type="monotone" dataKey="income" stroke={colors.success} fill={colors.bg.income} name="Income" />
                    <Area type="monotone" dataKey="expense" stroke={colors.danger} fill={colors.bg.expense} name="Expense" />
                  </>
                ) : (
                  <Area type="monotone" dataKey="expense" stroke={colors.danger} fill={colors.bg.expense} name="Expense" />
                )}
              </AreaChart>
            </ResponsiveContainer>
          )
        default:
          return (
            <ResponsiveContainer width="100%" height={350}>
              <BarChart {...commonProps}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" fontSize={12} />
                <YAxis fontSize={12} />
                <Tooltip />
                <Legend />
                {'income' in series[0] ? (
                  <>
                    <Bar dataKey="income" fill={colors.success} name="Income" />
                    <Bar dataKey="expense" fill={colors.danger} name="Expense" />
                  </>
                ) : (
                  <Bar dataKey="expense" fill={colors.danger} name="Expense" />
                )}
              </BarChart>
            </ResponsiveContainer>
          )
      }
    }

    switch (chartType) {
      case 'line':
        return (
          <ResponsiveContainer width="100%" height={350}>
            <LineChart data={points} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" fontSize={12} />
              <YAxis fontSize={12} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="value" stroke={colors.primary} />
            </LineChart>
          </ResponsiveContainer>
        )
      case 'area':
        return (
          <ResponsiveContainer width="100%" height={350}>
            <AreaChart data={points} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" fontSize={12} />
              <YAxis fontSize={12} />
              <Tooltip />
              <Legend />
              <Area type="monotone" dataKey="value" stroke={colors.primary} fill={colors.bg.active} />
            </AreaChart>
          </ResponsiveContainer>
        )
      default:
        return (
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={points} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" fontSize={12} />
              <YAxis fontSize={12} />
              <Tooltip />
              <Legend />
              <Bar dataKey="value">
                {points.map((_, i) => (
                  <Cell key={i} fill={points[i]?.color ?? colors.chart[i % colors.chart.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )
    }
  }

  const displayChartTypes = isSearch ? SEARCH_CHART_TYPES : CHART_TYPES

  return (
    <>
      <motion.div style={styles.container}>
        <div style={styles.header}>
          <h2 style={styles.title}>{t('reports.title')}</h2>
          <div style={{ display: 'flex', gap: spacing.sm }}>
            <motion.button
              style={styles.aiAnalysisBtn}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setShowAIAnalysis(true)}
            >
              {t('reports.aiAnalysis')}
            </motion.button>
            <ExportButton data={data} filename={selectedReport} reportTitle={t(`reports.${selectedReport}`)} chartRef={chartRef} currency={currency} locale={locale} />
          </div>
        </div>

        <div style={styles.toolbar}>
          <select
            style={styles.select}
            value={selectedReport}
            onChange={(e) => {
              setSelectedReport(e.target.value as ReportType)
              if (e.target.value !== 'searchReport') setSearchGenerated(false)
            }}
          >
            {REPORTS.map((r) => (
              <option key={r.id} value={r.id}>{t(`reports.${r.id}`)}</option>
            ))}
          </select>

          {isSearch ? (
            <div style={styles.searchSection}>
              <input
                style={styles.searchInput}
                type="text"
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                placeholder={t('reports.searchPlaceholder')}
                onKeyDown={(e) => { if (e.key === 'Enter') handleSearch() }}
              />
              <select
                style={styles.select}
                value={searchGrouping}
                onChange={(e) => setSearchGrouping(e.target.value as SearchGrouping)}
              >
                <option value="category">{t('reports.groupByCategory')}</option>
                <option value="month">{t('reports.groupByMonth')}</option>
              </select>
              <motion.button
                style={styles.generateBtn}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={handleSearch}
              >
                {t('reports.generate')}
              </motion.button>
            </div>
          ) : (
            <div style={styles.chartTypes}>
              {displayChartTypes.map((ct) => (
                <motion.button
                  key={ct}
                  style={{
                    ...styles.chartTypeBtn,
                    backgroundColor: chartType === ct ? colors.primary : colors.bg.muted,
                    color: chartType === ct ? colors.text.inverse : colors.text.secondary,
                  }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setChartType(ct)}
                >
                  {t(`reports.${ct}`)}
                </motion.button>
              ))}
            </div>
          )}

          <input style={styles.dateInput} type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} placeholder="From" />
          <input style={styles.dateInput} type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} placeholder="To" />
        </div>

        {isSearch && searchGenerated && (
          <div style={{ ...styles.chartTypes, marginBottom: spacing.md }}>
            {displayChartTypes.map((ct) => (
              <motion.button
                key={ct}
                style={{
                  ...styles.chartTypeBtn,
                  backgroundColor: chartType === ct ? colors.primary : colors.bg.muted,
                  color: chartType === ct ? colors.text.inverse : colors.text.secondary,
                }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setChartType(ct)}
              >
                {t(`reports.${ct}`)}
              </motion.button>
            ))}
          </div>
        )}

        <div ref={chartRef}>{renderChart()}</div>
      </motion.div>
      <div
        style={{
          minHeight: '50px',
          maxHeight: '200px',
          overflow: 'scroll',
        }}
      >
        {hasData && (
        <div style={styles.table}>
          {(() => {
            const tableData = pieData ?? data
            const firstRow = tableData[0]
            const hasDate = !!firstRow && 'date' in firstRow
            const hasIncome = hasDate && tableData.some(row => (row as TimeSeriesPoint).income > 0)
            const totalValue = tableData.reduce((sum, row) =>
              sum + ('value' in row ? (row as ReportDataPoint).value : (row as TimeSeriesPoint).expense), 0)
            const totalIncomeVal = hasIncome ? tableData.reduce((sum, row) =>
              sum + (row as TimeSeriesPoint).income, 0) : 0

            return (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: fontSize.sm }}>
                <thead>
                  <tr>
                    <th style={styles.th}>Name</th>
                    {hasDate ? <th style={styles.th}>Date</th> : null}
                    {hasIncome ? <th style={styles.thRight}>Income</th> : null}
                    <th style={styles.thRight}>{hasIncome ? 'Expense' : 'Value'}</th>
                  </tr>
                </thead>
                <tbody>
                  {tableData.map((row, i) => (
                    <tr key={i}>
                      <td style={styles.td}>{'name' in row ? row.name : row.date}</td>
                      {hasDate && <td style={styles.td}>{'date' in row ? row.date : ''}</td>}
                      {hasIncome && <td style={styles.tdRight}>{formatCurrency((row as TimeSeriesPoint).income, currency, locale)}</td>}
                      <td style={styles.tdRight}>{formatCurrency('value' in row ? (row as ReportDataPoint).value : (row as TimeSeriesPoint).expense, currency, locale)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td style={{ ...styles.td, fontWeight: fontWeight.semibold }}>Total</td>
                    {hasDate && <td style={styles.td}></td>}
                    {hasIncome && <td style={{ ...styles.tdRight, fontWeight: fontWeight.semibold }}>{formatCurrency(totalIncomeVal, currency, locale)}</td>}
                    <td style={{ ...styles.tdRight, fontWeight: fontWeight.semibold }}>{formatCurrency(totalValue, currency, locale)}</td>
                  </tr>
                </tfoot>
              </table>
            )
          })()}
        </div>

      )}
      </div>
      <AIAnalysisModal
        open={showAIAnalysis}
        onClose={() => setShowAIAnalysis(false)}
        reportData={data}
        reportType={t(`reports.${selectedReport}`)}
      />
    </>
  )
}

const styles: Record<string, React.CSSProperties> = {
  container: { padding: padding.page},
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.lg },
  title: { fontSize: fontSize.xxl, fontWeight: fontWeight.semibold, margin: 0, color: colors.text.primary },
  toolbar: { display: 'flex', gap: spacing.sm, flexWrap: 'wrap', marginBottom: spacing.lg, alignItems: 'center' },
  select: { padding: padding.input, fontSize: fontSize.md, border: `${borderWidth.default} solid ${colors.border.input}`, borderRadius: borderRadius.md, backgroundColor: colors.bg.input },
  searchSection: { display: 'flex', gap: spacing.sm, flex: 1, flexWrap: 'wrap' },
  searchInput: { padding: padding.input, fontSize: fontSize.md, border: `${borderWidth.default} solid ${colors.border.input}`, borderRadius: borderRadius.md, flex: 1, minWidth: '160px' },
  chartTypes: { display: 'flex', gap: spacing.xs },
  chartTypeBtn: { padding: '6px 12px', fontSize: fontSize.sm, border: `${borderWidth.default} solid ${colors.border.strong}`, borderRadius: borderRadius.sm, cursor: 'pointer' },
  dateInput: { padding: '6px 10px', fontSize: fontSize.md, border: `${borderWidth.default} solid ${colors.border.input}`, borderRadius: borderRadius.sm },
  generateBtn: {
    padding: padding.button,
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    color: colors.text.inverse,
    backgroundColor: colors.primary,
    border: 'none',
    borderRadius: borderRadius.md,
    cursor: 'pointer',
  },
  aiAnalysisBtn: {
    padding: padding.button,
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    color: colors.text.inverse,
    backgroundColor: '#6C5CE7',
    border: 'none',
    borderRadius: borderRadius.md,
    cursor: 'pointer',
  },
  noData: { padding: spacing.huge, textAlign: 'center', color: colors.text.disabled, fontSize: fontSize.base },
  table: { marginTop: spacing.lg, overflowX: 'auto' },
  th: { padding: padding.tableCell, textAlign: 'left', fontWeight: fontWeight.semibold, color: colors.text.muted, borderBottom: `${borderWidth.thick} solid ${colors.border.divider}`, fontSize: fontSize.sm },
  thRight: { padding: padding.tableCell, textAlign: 'right', fontWeight: fontWeight.semibold, color: colors.text.muted, borderBottom: `${borderWidth.thick} solid ${colors.border.divider}`, fontSize: fontSize.sm },
  td: { padding: padding.tableCellSm, borderBottom: `${borderWidth.default} solid ${colors.border.light}`, fontSize: fontSize.md },
  tdRight: { padding: padding.tableCellSm, borderBottom: `${borderWidth.default} solid ${colors.border.light}`, textAlign: 'right', fontSize: fontSize.md },
}

export default ReportsPage
