import { useState, useMemo, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useAppStore } from '../../core/store/useAppStore'
import {
  ReportService,
  ChartType,
  Grouping,
  Aggregation,
  CustomReportQuery,
  TimeSeriesPoint
} from '../../core/services/ReportService'
import {
  LineChart, Line, BarChart, Bar, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts'
import ReportFilterPanel from '../components/ReportFilterPanel'
import GroupingSelector from '../components/GroupingSelector'
import ExportButton from '../components/ExportButton'
import { formatCurrency } from '../../core/utils/format'

const CHART_TYPES: ChartType[] = ['line', 'bar', 'area']

function CustomReportBuilderPage(): JSX.Element {
  const { t, i18n } = useTranslation()
  const { dataset } = useAppStore()
  const locale = i18n.language === 'fa' ? 'fa-IR' : 'en-US'
  const currency = dataset?.currency || 'USD'

  const transactions = dataset?.transactions ?? []
  const categories = dataset?.categories ?? []

  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([])
  const [selectedTypes, setSelectedTypes] = useState<string[]>(['income', 'expense'])
  const [grouping, setGrouping] = useState<Grouping>('month')
  const [aggregation, setAggregation] = useState<Aggregation>('sum')
  const [chartType, setChartType] = useState<ChartType>('bar')
  const [generated, setGenerated] = useState(false)

  const query: CustomReportQuery = useMemo(
    () => ({
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
      categoryIds: selectedCategoryIds.length > 0 ? selectedCategoryIds : undefined,
      types: selectedTypes.length > 0 ? selectedTypes : undefined,
      grouping,
      aggregation
    }),
    [dateFrom, dateTo, selectedCategoryIds, selectedTypes, grouping, aggregation]
  )

  const data = useMemo<TimeSeriesPoint[]>(
    () => (generated ? ReportService.generateCustom(transactions, query) : []),
    [transactions, query, generated]
  )

  const handleGenerate = useCallback(() => setGenerated(true), [])

  const hasData = data.length > 0

  const renderChart = (): JSX.Element | null => {
    if (!generated) return <div style={styles.hint}>Configure filters and click "Generate Report"</div>
    if (!hasData) return <div style={styles.noData}>{t('customReport.noData')}</div>

    const commonProps = { data, margin: { top: 10, right: 30, left: 0, bottom: 0 } }

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
              <Line type="monotone" dataKey="expense" stroke="#4A90D9" name="Value" />
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
              <Area type="monotone" dataKey="expense" stroke="#4A90D9" fill="#d0e4f5" name="Value" />
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
              <Bar dataKey="expense" fill="#4A90D9" name="Value" />
            </BarChart>
          </ResponsiveContainer>
        )
    }
  }

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>{t('customReport.builder')}</h2>

      <div style={styles.sidebar}>
        <ReportFilterPanel
          dateFrom={dateFrom}
          dateTo={dateTo}
          selectedCategoryIds={selectedCategoryIds}
          selectedTypes={selectedTypes}
          categories={categories}
          onDateFromChange={setDateFrom}
          onDateToChange={setDateTo}
          onCategoryIdsChange={setSelectedCategoryIds}
          onTypesChange={setSelectedTypes}
        />
        <GroupingSelector
          grouping={grouping}
          aggregation={aggregation}
          onGroupingChange={setGrouping}
          onAggregationChange={setAggregation}
        />
        <button style={styles.generateBtn} onClick={handleGenerate}>
          {t('customReport.generate')}
        </button>
      </div>

      <div style={styles.chartArea}>
        <div style={styles.chartToolbar}>
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
          {generated && hasData && <ExportButton data={data} filename="custom-report" reportTitle="Custom Report" />}
        </div>
        {renderChart()}
        {hasData && (
          <div style={styles.table}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr>
                  <th style={styles.th}>Date</th>
                  <th style={styles.thRight}>Value</th>
                </tr>
              </thead>
              <tbody>
                {data.map((row, i) => (
                  <tr key={i}>
                    <td style={styles.td}>{row.date}</td>
                    <td style={styles.tdRight}>{formatCurrency(row.expense, currency, locale)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  container: { display: 'flex', gap: '24px', padding: '24px' },
  sidebar: { width: '320px', minWidth: '280px', display: 'flex', flexDirection: 'column', gap: '16px' },
  chartArea: { flex: 1, minWidth: 0 },
  title: { fontSize: '20px', fontWeight: 600, margin: 0, color: '#1a1a1a' },
  chartToolbar: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' },
  chartTypes: { display: 'flex', gap: '4px' },
  chartTypeBtn: { padding: '6px 12px', fontSize: '12px', border: '1px solid #ddd', borderRadius: '4px', cursor: 'pointer' },
  generateBtn: {
    padding: '10px 16px',
    fontSize: '14px',
    fontWeight: 600,
    color: '#fff',
    backgroundColor: '#4A90D9',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer'
  },
  noData: { padding: '48px', textAlign: 'center', color: '#888', fontSize: '14px' },
  hint: { padding: '48px', textAlign: 'center', color: '#aaa', fontSize: '14px' },
  table: { marginTop: '16px', overflowX: 'auto' },
  th: { padding: '8px 10px', textAlign: 'left', fontWeight: 600, color: '#555', borderBottom: '2px solid #eee', fontSize: '12px' },
  thRight: { padding: '8px 10px', textAlign: 'right', fontWeight: 600, color: '#555', borderBottom: '2px solid #eee', fontSize: '12px' },
  td: { padding: '6px 10px', borderBottom: '1px solid #f0f0f0', fontSize: '13px' },
  tdRight: { padding: '6px 10px', borderBottom: '1px solid #f0f0f0', textAlign: 'right', fontSize: '13px' }
}

export default CustomReportBuilderPage
