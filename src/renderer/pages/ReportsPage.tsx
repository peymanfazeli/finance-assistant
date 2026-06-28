import { useState, useMemo, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useAppStore } from '../../core/store/useAppStore'
import { ReportService, ReportType, ChartType, ReportDataPoint, TimeSeriesPoint } from '../../core/services/ReportService'
import ExportButton from '../components/ExportButton'
import { formatCurrency } from '../../core/utils/format'
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
  { id: 'topExpenses', label: 'Top Expenses' },
  { id: 'topIncome', label: 'Top Income' },
  { id: 'spendingTrends', label: 'Spending Trends' }
]

const CHART_TYPES: ChartType[] = ['line', 'bar', 'pie', 'donut', 'area']
const COLORS = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F', '#E67E22', '#2ECC71']

function ReportsPage(): JSX.Element {
  const { t, i18n } = useTranslation()
  const { dataset } = useAppStore()
  const locale = i18n.language === 'fa' ? 'fa-IR' : 'en-US'
  const currency = dataset?.currency || 'USD'
  const [selectedReport, setSelectedReport] = useState<ReportType>('expenseByCategory')
  const [chartType, setChartType] = useState<ChartType>('bar')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  const transactions = dataset?.transactions ?? []
  const categories = dataset?.categories ?? []

  const data = useMemo(
    () => ReportService.generate(transactions, categories, selectedReport, dateFrom || undefined, dateTo || undefined),
    [transactions, categories, selectedReport, dateFrom, dateTo]
  )

  const chartRef = useRef<HTMLDivElement>(null)

  const isPie = chartType === 'pie' || chartType === 'donut'
  const points = data as ReportDataPoint[]
  const series = data as TimeSeriesPoint[]
  const hasData = data.length > 0
  const hasDate = hasData && 'date' in data[0]

  const pieData: ReportDataPoint[] | null = useMemo(() => {
    if (!isPie || !hasDate) return null
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
  }, [isPie, hasDate, selectedReport, data, transactions, categories, dateFrom, dateTo])

  const renderChart = (): JSX.Element | null => {
    if (!hasData) return <div style={styles.noData}>{t('reports.noData')}</div>

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
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
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
                    <Line type="monotone" dataKey="income" stroke="#28a745" name="Income" />
                    <Line type="monotone" dataKey="expense" stroke="#dc3545" name="Expense" />
                  </>
                ) : (
                  <Line type="monotone" dataKey="expense" stroke="#dc3545" name="Expense" />
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
                    <Area type="monotone" dataKey="income" stroke="#28a745" fill="#c3e6cb" name="Income" />
                    <Area type="monotone" dataKey="expense" stroke="#dc3545" fill="#f8d7da" name="Expense" />
                  </>
                ) : (
                  <Area type="monotone" dataKey="expense" stroke="#dc3545" fill="#f8d7da" name="Expense" />
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
                    <Bar dataKey="income" fill="#28a745" name="Income" />
                    <Bar dataKey="expense" fill="#dc3545" name="Expense" />
                  </>
                ) : (
                  <Bar dataKey="expense" fill="#dc3545" name="Expense" />
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
              <Line type="monotone" dataKey="value" stroke="#4A90D9" />
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
              <Area type="monotone" dataKey="value" stroke="#4A90D9" fill="#d0e6f5" />
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
                  <Cell key={i} fill={points[i]?.color ?? COLORS[i % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )
    }
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>{t('reports.title')}</h2>
        <ExportButton data={data} filename={selectedReport} reportTitle={t(`reports.${selectedReport}`)} chartRef={chartRef} />
      </div>

      <div style={styles.toolbar}>
        <select
          style={styles.select}
          value={selectedReport}
          onChange={(e) => setSelectedReport(e.target.value as ReportType)}
        >
          {REPORTS.map((r) => (
            <option key={r.id} value={r.id}>{t(`reports.${r.id}`)}</option>
          ))}
        </select>
        <div style={styles.chartTypes}>
          {CHART_TYPES.map((ct) => (
            <button
              key={ct}
              style={{
                ...styles.chartTypeBtn,
                backgroundColor: chartType === ct ? '#4A90D9' : '#f0f0f0',
                color: chartType === ct ? '#fff' : '#333'
              }}
              onClick={() => setChartType(ct)}
            >
              {t(`reports.${ct}`)}
            </button>
          ))}
        </div>
        <input style={styles.dateInput} type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} placeholder="From" />
        <input style={styles.dateInput} type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} placeholder="To" />
      </div>

      <div ref={chartRef}>{renderChart()}</div>

      {hasData && (
        <div style={styles.table}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr>
                <th style={styles.th}>Name</th>
                {'date' in ((pieData ?? data)[0] ?? {}) ? <th style={styles.th}>Date</th> : null}
                <th style={styles.thRight}>Value</th>
              </tr>
            </thead>
            <tbody>
              {(pieData ?? data).map((row, i) => (
                <tr key={i}>
                  <td style={styles.td}>{'name' in row ? row.name : row.date}</td>
                  {'date' in row && <td style={styles.td}>{row.date}</td>}
                  <td style={styles.tdRight}>{formatCurrency('value' in row ? row.value : row.expense, currency, locale)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  container: { padding: '24px' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' },
  title: { fontSize: '20px', fontWeight: 600, margin: 0, color: '#1a1a1a' },
  toolbar: { display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px', alignItems: 'center' },
  select: { padding: '8px 12px', fontSize: '13px', border: '1px solid #ccc', borderRadius: '6px', backgroundColor: '#fff' },
  chartTypes: { display: 'flex', gap: '4px' },
  chartTypeBtn: { padding: '6px 12px', fontSize: '12px', border: '1px solid #ddd', borderRadius: '4px', cursor: 'pointer' },
  dateInput: { padding: '6px 10px', fontSize: '13px', border: '1px solid #ccc', borderRadius: '4px' },
  noData: { padding: '48px', textAlign: 'center', color: '#888', fontSize: '14px' },
  table: { marginTop: '16px', overflowX: 'auto' },
  th: { padding: '8px 10px', textAlign: 'left', fontWeight: 600, color: '#555', borderBottom: '2px solid #eee', fontSize: '12px' },
  thRight: { padding: '8px 10px', textAlign: 'right', fontWeight: 600, color: '#555', borderBottom: '2px solid #eee', fontSize: '12px' },
  td: { padding: '6px 10px', borderBottom: '1px solid #f0f0f0', fontSize: '13px' },
  tdRight: { padding: '6px 10px', borderBottom: '1px solid #f0f0f0', textAlign: 'right', fontSize: '13px' }
}

export default ReportsPage
