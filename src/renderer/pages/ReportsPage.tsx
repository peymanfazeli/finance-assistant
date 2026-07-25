import { useState, useMemo, useRef, useCallback } from 'react'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { useAppStore } from '../../core/store/useAppStore'
import { ReportService, ReportType, ChartType, ReportDataPoint, TimeSeriesPoint, SearchGrouping } from '../../core/services/ReportService'
import ExportButton from '../components/ExportButton'
import AIAnalysisModal from '../components/AIAnalysisModal'
import { formatCurrency } from '../../core/utils/format'
import { formatJalaliDateEn } from '../../core/utils/jalali'
import PersianCalendar from '../components/PersianCalendar'
import { colors, spacing, fontSize, fontWeight, borderRadius, padding, shadow, borderWidth } from '../../core/utils/styles'
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts'

interface ReportCategory {
  id: string
  label: string
  icon: string
  reports: { id: ReportType; label: string }[]
}

function getReportCategories(t: (key: string) => string): ReportCategory[] {
  return [
    {
      id: 'expense',
      label: t('transaction.expense'),
      icon: '💸',
      reports: [
        { id: 'expenseByCategory', label: t('reports.expenseByCategory') },
        { id: 'dailySpending', label: t('reports.dailySpending') },
        { id: 'weeklySpending', label: t('reports.weeklySpending') },
        { id: 'monthlySpending', label: t('reports.monthlySpending') },
        { id: 'topExpenses', label: t('reports.topExpenses') },
      ]
    },
    {
      id: 'income',
      label: t('transaction.income'),
      icon: '💰',
      reports: [
        { id: 'incomeByCategory', label: t('reports.incomeByCategory') },
        { id: 'topIncome', label: t('reports.topIncome') },
      ]
    },
    {
      id: 'investment',
      label: t('transaction.investment'),
      icon: '📈',
      reports: [
        { id: 'investByCategory', label: t('reports.investByCategory') },
        { id: 'investVsIncome', label: t('reports.investVsIncome') },
        { id: 'investVsExpense', label: t('reports.investVsExpense') },
      ]
    },
    {
      id: 'comparison',
      label: t('reports.incomeVsExpense'),
      icon: '⚖️',
      reports: [
        { id: 'incomeVsExpense', label: t('reports.incomeVsExpense') },
        { id: 'allByCategory', label: t('reports.allByCategory') },
        { id: 'spendingTrends', label: t('reports.spendingTrends') },
      ]
    },
    {
      id: 'search',
      label: t('reports.searchReport'),
      icon: '🔍',
      reports: [
        { id: 'searchReport', label: t('reports.searchReport') },
      ]
    },
  ]
}

const CHART_TYPES: ChartType[] = ['line', 'bar', 'pie', 'donut', 'area']
const SEARCH_CHART_TYPES: ChartType[] = ['bar', 'line', 'area']

function ReportsPage(): JSX.Element {
  const { t, i18n } = useTranslation()
  const { dataset } = useAppStore()
  const locale = i18n.language === 'fa' ? 'fa-IR' : 'en-US'
  const currency = dataset?.currency || 'toman'
  const [selectedReport, setSelectedReport] = useState<ReportType>('expenseByCategory')
  const [chartType, setChartType] = useState<ChartType>('bar')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [searchKeyword, setSearchKeyword] = useState('')
  const [searchGrouping, setSearchGrouping] = useState<SearchGrouping>('category')
  const [searchGenerated, setSearchGenerated] = useState(false)
  const [showAIAnalysis, setShowAIAnalysis] = useState(false)
  const [activeCategory, setActiveCategory] = useState('expense')

  const transactions = dataset?.transactions ?? []
  const categories = dataset?.categories ?? []
  const categoriesList = useMemo(() => getReportCategories(t), [t])

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

  const handleCategoryClick = useCallback((catId: string, firstReport: ReportType) => {
    setActiveCategory(catId)
    setSelectedReport(firstReport)
    setSearchGenerated(false)
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
        <ResponsiveContainer width="100%" height={320}>
          <PieChart>
            <Pie
              data={pd}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={110}
              innerRadius={chartType === 'donut' ? 55 : 0}
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
      const hasIncome = series.some((s) => s.income > 0)
      const hasExpense = series.some((s) => s.expense > 0)
      const hasInvestment = series.some((s) => s.investment > 0)
      switch (chartType) {
        case 'line':
          return (
            <ResponsiveContainer width="100%" height={320}>
              <LineChart {...commonProps}>
                <CartesianGrid strokeDasharray="3 3" stroke={colors.border.divider} />
                <XAxis dataKey="date" fontSize={11} tickFormatter={(d) => formatJalaliDateEn(d)} tick={{ fill: colors.text.disabled }} />
                <YAxis fontSize={11} tick={{ fill: colors.text.disabled }} />
                <Tooltip />
                <Legend />
                {hasIncome && <Line type="monotone" dataKey="income" stroke={colors.success} name="Income" strokeWidth={2} dot={false} />}
                {hasExpense && <Line type="monotone" dataKey="expense" stroke={colors.danger} name="Expense" strokeWidth={2} dot={false} />}
                {hasInvestment && <Line type="monotone" dataKey="investment" stroke={colors.text.investment} name="Investment" strokeWidth={2} dot={false} />}
              </LineChart>
            </ResponsiveContainer>
          )
        case 'area':
          return (
            <ResponsiveContainer width="100%" height={320}>
              <AreaChart {...commonProps}>
                <CartesianGrid strokeDasharray="3 3" stroke={colors.border.divider} />
                <XAxis dataKey="date" fontSize={11} tickFormatter={(d) => formatJalaliDateEn(d)} tick={{ fill: colors.text.disabled }} />
                <YAxis fontSize={11} tick={{ fill: colors.text.disabled }} />
                <Tooltip />
                <Legend />
                {hasIncome && <Area type="monotone" dataKey="income" stroke={colors.success} fill={colors.bg.income} name="Income" />}
                {hasExpense && <Area type="monotone" dataKey="expense" stroke={colors.danger} fill={colors.bg.expense} name="Expense" />}
                {hasInvestment && <Area type="monotone" dataKey="investment" stroke={colors.text.investment} fill={colors.bg.investment} name="Investment" />}
              </AreaChart>
            </ResponsiveContainer>
          )
        default:
          return (
            <ResponsiveContainer width="100%" height={320}>
              <BarChart {...commonProps}>
                <CartesianGrid strokeDasharray="3 3" stroke={colors.border.divider} />
                <XAxis dataKey="date" fontSize={11} tickFormatter={(d) => formatJalaliDateEn(d)} tick={{ fill: colors.text.disabled }} />
                <YAxis fontSize={11} tick={{ fill: colors.text.disabled }} />
                <Tooltip />
                <Legend />
                {hasIncome && <Bar dataKey="income" fill={colors.success} name="Income" radius={[3, 3, 0, 0]} />}
                {hasExpense && <Bar dataKey="expense" fill={colors.danger} name="Expense" radius={[3, 3, 0, 0]} />}
                {hasInvestment && <Bar dataKey="investment" fill={colors.text.investment} name="Investment" radius={[3, 3, 0, 0]} />}
              </BarChart>
            </ResponsiveContainer>
          )
      }
    }

    switch (chartType) {
      case 'line':
        return (
          <ResponsiveContainer width="100%" height={320}>
            <LineChart data={points} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={colors.border.divider} />
              <XAxis dataKey="name" fontSize={11} tick={{ fill: colors.text.disabled }} />
              <YAxis fontSize={11} tick={{ fill: colors.text.disabled }} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="value" stroke={colors.primary} strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        )
      case 'area':
        return (
          <ResponsiveContainer width="100%" height={320}>
            <AreaChart data={points} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={colors.border.divider} />
              <XAxis dataKey="name" fontSize={11} tick={{ fill: colors.text.disabled }} />
              <YAxis fontSize={11} tick={{ fill: colors.text.disabled }} />
              <Tooltip />
              <Legend />
              <Area type="monotone" dataKey="value" stroke={colors.primary} fill={colors.bg.active} />
            </AreaChart>
          </ResponsiveContainer>
        )
      default:
        return (
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={points} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={colors.border.divider} />
              <XAxis dataKey="name" fontSize={11} tick={{ fill: colors.text.disabled }} />
              <YAxis fontSize={11} tick={{ fill: colors.text.disabled }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="value" radius={[3, 3, 0, 0]}>
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
  const currentCategory = categoriesList.find(c => c.id === activeCategory)
  const currentReportLabel = currentCategory?.reports.find(r => r.id === selectedReport)?.label ?? ''

  return (
    <div style={styles.page}>
      <aside style={styles.sidebar}>
        <div style={styles.sidebarHeader}>
          <span style={styles.sidebarTitle}>{t('reports.title')}</span>
        </div>

        <div style={styles.sidebarFilterSection}>
          <div style={styles.filterLabel}>{t('common.filter')}</div>
          <PersianCalendar value={dateFrom} onChange={setDateFrom} placeholder="From" compact />
          <PersianCalendar value={dateTo} onChange={setDateTo} placeholder="To" compact />
        </div>

        <nav style={styles.categoryNav}>
          {categoriesList.map((cat) => (
            <button
              key={cat.id}
              style={{
                ...styles.categoryBtn,
                ...(activeCategory === cat.id ? styles.categoryBtnActive : {}),
              }}
              onClick={() => handleCategoryClick(cat.id, cat.reports[0].id)}
            >
              <span style={styles.categoryIcon}>{cat.icon}</span>
              <span style={styles.categoryLabel}>{cat.label}</span>
            </button>
          ))}
        </nav>

        <div style={styles.reportListSection}>
          <div style={styles.reportListLabel}>
            {currentCategory?.icon} {currentCategory?.label}
          </div>
          <div style={styles.reportList}>
            {currentCategory?.reports.map((report) => (
              <button
                key={report.id}
                style={{
                  ...styles.reportItem,
                  ...(selectedReport === report.id ? styles.reportItemActive : {}),
                }}
                onClick={() => {
                  setSelectedReport(report.id)
                  if (report.id !== 'searchReport') setSearchGenerated(false)
                }}
              >
                {report.label}
              </button>
            ))}
          </div>
        </div>

        <div style={styles.sidebarFooter}>
          <motion.button
            style={styles.aiBtn}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            onClick={() => setShowAIAnalysis(true)}
          >
            ✨ {t('reports.aiAnalysis')}
          </motion.button>
          <ExportButton data={data} filename={selectedReport} reportTitle={currentReportLabel} chartRef={chartRef} currency={currency} locale={locale} />
        </div>
      </aside>

      <div style={styles.main}>
        <div style={styles.mainHeader}>
          <div style={styles.mainHeaderLeft}>
            <h2 style={styles.title}>{currentReportLabel}</h2>
            <p style={styles.subtitle}>{currentCategory?.icon} {currentCategory?.label}</p>
          </div>
          <div style={styles.chartTypeBar}>
            {displayChartTypes.map((ct) => (
              <button
                key={ct}
                style={{
                  ...styles.chartTypeBtn,
                  ...(chartType === ct ? styles.chartTypeBtnActive : {}),
                }}
                onClick={() => setChartType(ct)}
              >
                {t(`reports.${ct}`)}
              </button>
            ))}
          </div>
        </div>

        {isSearch && (
          <div style={styles.searchBar}>
            <input
              style={styles.searchInput}
              type="text"
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              placeholder={t('reports.searchPlaceholder')}
              onKeyDown={(e) => { if (e.key === 'Enter') handleSearch() }}
            />
            <select
              style={styles.searchSelect}
              value={searchGrouping}
              onChange={(e) => setSearchGrouping(e.target.value as SearchGrouping)}
            >
              <option value="category">{t('reports.groupByCategory')}</option>
              <option value="month">{t('reports.groupByMonth')}</option>
            </select>
            <motion.button
              style={styles.generateBtn}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              onClick={handleSearch}
            >
              {t('reports.generate')}
            </motion.button>
          </div>
        )}

        <div ref={chartRef} style={styles.chartCard}>
          {renderChart()}
        </div>

        {hasData && (() => {
          const tableData = pieData ?? data
          const firstRow = tableData[0]
          const tableHasDate = !!firstRow && 'date' in firstRow
          const tableHasIncome = tableHasDate && tableData.some(r => (r as TimeSeriesPoint).income > 0)
          return (
            <div style={styles.tableCard}>
              <div style={styles.tableHeader}>
                <span style={styles.tableRowCount}>{tableData.length} rows</span>
              </div>
              <div style={styles.tableScroll}>
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={styles.th}>{tableHasDate ? t('transaction.date') : t('transaction.category')}</th>
                      {tableHasDate && <th style={styles.th}>{t('transaction.category')}</th>}
                      {tableHasIncome && <th style={styles.thRight}>{t('transaction.income')}</th>}
                      <th style={styles.thRight}>{tableHasIncome ? t('transaction.expense') : 'Value'}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tableData.map((row, i) => {
                      const rowHasDate = 'date' in row
                      return (
                        <tr key={i} style={i % 2 === 0 ? styles.tableRowEven : undefined}>
                          <td style={styles.td}>
                            {rowHasDate ? formatJalaliDateEn((row as TimeSeriesPoint).date) : ('name' in row ? row.name : '')}
                          </td>
                          {tableHasDate && <td style={styles.td}>{'name' in row ? row.name : ''}</td>}
                          {tableHasIncome && (
                            <td style={styles.tdRight}>{formatCurrency((row as TimeSeriesPoint).income, currency, locale)}</td>
                          )}
                          <td style={styles.tdRight}>
                            {formatCurrency(
                              'value' in row ? (row as ReportDataPoint).value : (row as TimeSeriesPoint).expense,
                              currency, locale
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                  <tfoot>
                    <tr style={styles.tableFooter}>
                      <td style={{ ...styles.td, fontWeight: fontWeight.semibold }}>Total</td>
                      {tableHasDate && <td style={styles.td}></td>}
                      {tableHasIncome && (
                        <td style={{ ...styles.tdRight, fontWeight: fontWeight.semibold }}>
                          {formatCurrency(
                            tableData.reduce((sum, r) => sum + ((r as TimeSeriesPoint).income ?? 0), 0),
                            currency, locale
                          )}
                        </td>
                      )}
                      <td style={{ ...styles.tdRight, fontWeight: fontWeight.semibold }}>
                        {formatCurrency(
                          tableData.reduce((sum, r) =>
                            sum + ('value' in r ? (r as ReportDataPoint).value : (r as TimeSeriesPoint).expense), 0),
                          currency, locale
                        )}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )
        })()}
      </div>

      <AIAnalysisModal
        open={showAIAnalysis}
        onClose={() => setShowAIAnalysis(false)}
        reportData={data}
        reportType={currentReportLabel}
      />
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    display: 'flex',
    height: '100%',
    overflow: 'hidden',
  },
  sidebar: {
    width: '240px',
    minWidth: '240px',
    backgroundColor: colors.bg.card,
    borderRight: `${borderWidth.default} solid ${colors.border.light}`,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  sidebarHeader: {
    padding: `${spacing.lg} ${spacing.lg} ${spacing.md}`,
    borderBottom: `${borderWidth.default} solid ${colors.border.light}`,
  },
  sidebarTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.text.primary,
  },
  categoryNav: {
    display: 'flex',
    flexDirection: 'column',
    padding: spacing.sm,
    gap: '1px',
  },
  categoryBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: spacing.sm,
    padding: `${spacing.sm} ${spacing.md}`,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.text.muted,
    backgroundColor: 'transparent',
    border: 'none',
    borderRadius: borderRadius.md,
    cursor: 'pointer',
    textAlign: 'left',
    transition: 'all 0.15s ease',
  },
  categoryBtnActive: {
    backgroundColor: colors.bg.active,
    color: colors.primary,
    fontWeight: fontWeight.semibold,
  },
  categoryIcon: {
    fontSize: fontSize.md,
    width: '20px',
    textAlign: 'center',
  },
  categoryLabel: {
    flex: 1,
  },
  reportListSection: {
    flex: 1,
    minHeight: 0,
    display: 'flex',
    flexDirection: 'column',
    borderTop: `${borderWidth.default} solid ${colors.border.light}`,
  },
  reportListLabel: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    color: colors.text.disabled,
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    padding: `${spacing.sm} ${spacing.md}`,
  },
  reportList: {
    flex: 1,
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '1px',
    padding: `0 ${spacing.sm} ${spacing.sm}`,
  },
  reportItem: {
    padding: `${spacing.sm} ${spacing.md} ${spacing.sm} ${spacing.xl}`,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.text.subtle,
    backgroundColor: 'transparent',
    border: 'none',
    borderRadius: borderRadius.sm,
    cursor: 'pointer',
    textAlign: 'left',
    transition: 'all 0.15s ease',
    flexShrink: 0,
  },
  reportItemActive: {
    backgroundColor: colors.bg.muted,
    color: colors.primary,
    fontWeight: fontWeight.semibold,
  },
  sidebarFilterSection: {
    padding: `${spacing.md} ${spacing.lg}`,
    borderTop: `${borderWidth.default} solid ${colors.border.light}`,
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.sm,
    flexShrink: 0,
  },
  filterLabel: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    color: colors.text.disabled,
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  sidebarFooter: {
    padding: spacing.md,
    borderTop: `${borderWidth.default} solid ${colors.border.light}`,
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.sm,
    flexShrink: 0,
  },
  aiBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    padding: `${spacing.sm} ${spacing.md}`,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.text.inverse,
    backgroundColor: '#6C5CE7',
    border: 'none',
    borderRadius: borderRadius.md,
    cursor: 'pointer',
  },
  main: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    padding: spacing.xxl,
    overflow: 'auto',
    minWidth: 0,
    gap: spacing.lg,
  },
  mainHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    flexShrink: 0,
  },
  mainHeaderLeft: {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.xs,
  },
  title: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.semibold,
    margin: 0,
    color: colors.text.primary,
  },
  subtitle: {
    fontSize: fontSize.sm,
    color: colors.text.disabled,
    margin: 0,
  },
  chartTypeBar: {
    display: 'flex',
    gap: '2px',
    backgroundColor: colors.bg.muted,
    borderRadius: borderRadius.md,
    padding: '2px',
  },
  chartTypeBtn: {
    padding: `${spacing.xs} ${spacing.md}`,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.text.muted,
    backgroundColor: 'transparent',
    border: 'none',
    borderRadius: borderRadius.sm,
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },
  chartTypeBtnActive: {
    backgroundColor: colors.bg.card,
    color: colors.primary,
    fontWeight: fontWeight.semibold,
    boxShadow: shadow.card,
  },
  searchBar: {
    display: 'flex',
    gap: spacing.sm,
    alignItems: 'center',
    flexShrink: 0,
  },
  searchInput: {
    flex: 1,
    padding: `${spacing.sm} ${spacing.md}`,
    fontSize: fontSize.sm,
    border: `${borderWidth.default} solid ${colors.border.input}`,
    borderRadius: borderRadius.md,
    outline: 'none',
    backgroundColor: colors.bg.card,
  },
  searchSelect: {
    padding: `${spacing.sm} ${spacing.md}`,
    fontSize: fontSize.sm,
    border: `${borderWidth.default} solid ${colors.border.input}`,
    borderRadius: borderRadius.md,
    backgroundColor: colors.bg.card,
    cursor: 'pointer',
  },
  generateBtn: {
    padding: `${spacing.sm} ${spacing.lg}`,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.text.inverse,
    backgroundColor: colors.primary,
    border: 'none',
    borderRadius: borderRadius.md,
    cursor: 'pointer',
  },
  chartCard: {
    backgroundColor: colors.bg.card,
    borderRadius: borderRadius.lg,
    border: `${borderWidth.default} solid ${colors.border.light}`,
    padding: spacing.xl,
    flexShrink: 0,
  },
  noData: {
    padding: spacing.massive,
    textAlign: 'center',
    color: colors.text.disabled,
    fontSize: fontSize.sm,
  },
  tableCard: {
    backgroundColor: colors.bg.card,
    borderRadius: borderRadius.lg,
    border: `${borderWidth.default} solid ${colors.border.light}`,
    overflow: 'hidden',
    flexShrink: 0,
  },
  tableHeader: {
    display: 'flex',
    justifyContent: 'flex-end',
    padding: `${spacing.sm} ${spacing.lg}`,
    borderBottom: `${borderWidth.default} solid ${colors.border.light}`,
  },
  tableRowCount: {
    fontSize: fontSize.xs,
    color: colors.text.disabled,
  },
  tableScroll: {
    maxHeight: '250px',
    overflowY: 'auto',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: fontSize.sm,
  },
  th: {
    padding: `${spacing.sm} ${spacing.lg}`,
    textAlign: 'left',
    fontWeight: fontWeight.semibold,
    color: colors.text.disabled,
    backgroundColor: colors.bg.muted,
    borderBottom: `${borderWidth.thick} solid ${colors.border.divider}`,
    fontSize: fontSize.xs,
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    position: 'sticky',
    top: 0,
    zIndex: 1,
  },
  thRight: {
    padding: `${spacing.sm} ${spacing.lg}`,
    textAlign: 'right',
    fontWeight: fontWeight.semibold,
    color: colors.text.disabled,
    backgroundColor: colors.bg.muted,
    borderBottom: `${borderWidth.thick} solid ${colors.border.divider}`,
    fontSize: fontSize.xs,
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    position: 'sticky',
    top: 0,
    zIndex: 1,
  },
  td: {
    padding: `${spacing.sm} ${spacing.lg}`,
    borderBottom: `${borderWidth.default} solid ${colors.border.light}`,
    fontSize: fontSize.sm,
    color: colors.text.primary,
  },
  tdRight: {
    padding: `${spacing.sm} ${spacing.lg}`,
    borderBottom: `${borderWidth.default} solid ${colors.border.light}`,
    textAlign: 'right',
    fontSize: fontSize.sm,
    color: colors.text.primary,
    fontVariantNumeric: 'tabular-nums',
  },
  tableRowEven: {
    backgroundColor: colors.bg.muted,
  },
  tableFooter: {
    backgroundColor: colors.bg.muted,
  },
}

export default ReportsPage
