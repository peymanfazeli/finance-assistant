import { useState, useMemo, useCallback } from 'react'
import { motion } from 'framer-motion'
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
import { colors, spacing, fontSize, fontWeight, borderRadius, padding, borderWidth } from '../../core/utils/styles'
import ReportFilterPanel from '../components/ReportFilterPanel'
import GroupingSelector from '../components/GroupingSelector'
import ExportButton from '../components/ExportButton'
import { formatCurrency } from '../../core/utils/format'
import { formatJalaliDateEn } from '../../core/utils/jalali'

const CHART_TYPES: ChartType[] = ['line', 'bar', 'area']

function CustomReportBuilderPage(): JSX.Element {
  const { t, i18n } = useTranslation()
  const { dataset } = useAppStore()
  const locale = i18n.language === 'fa' ? 'fa-IR' : 'en-US'
  const currency = dataset?.currency || 'toman'

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
              <XAxis dataKey="date" fontSize={12} tickFormatter={(d) => formatJalaliDateEn(d)} />
              <YAxis fontSize={12} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="expense" stroke={colors.primary} name="Value" />
            </LineChart>
          </ResponsiveContainer>
        )
      case 'area':
        return (
          <ResponsiveContainer width="100%" height={350}>
            <AreaChart {...commonProps}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" fontSize={12} tickFormatter={(d) => formatJalaliDateEn(d)} />
              <YAxis fontSize={12} />
              <Tooltip />
              <Legend />
              <Area type="monotone" dataKey="expense" stroke={colors.primary} fill={colors.bg.active} name="Value" />
            </AreaChart>
          </ResponsiveContainer>
        )
      default:
        return (
          <ResponsiveContainer width="100%" height={350}>
            <BarChart {...commonProps}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" fontSize={12} tickFormatter={(d) => formatJalaliDateEn(d)} />
              <YAxis fontSize={12} />
              <Tooltip />
              <Legend />
              <Bar dataKey="expense" fill={colors.primary} name="Value" />
            </BarChart>
          </ResponsiveContainer>
        )
    }
  }

  return (
    <motion.div style={styles.container}>
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
        <motion.button
          style={styles.generateBtn}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={handleGenerate}
        >
          {t('customReport.generate')}
        </motion.button>
      </div>

      <div style={styles.chartArea}>
        <div style={styles.chartToolbar}>
          <div style={styles.chartTypes}>
            {CHART_TYPES.map((ct) => (
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
          {generated && hasData && <ExportButton data={data} filename="custom-report" reportTitle="Custom Report" currency={currency} locale={locale} />}
        </div>
        {renderChart()}
        {hasData && (
          <div style={styles.table}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: fontSize.sm }}>
              <thead>
                <tr>
                  <th style={styles.th}>{t('transaction.date')}</th>
                  <th style={styles.thRight}>Value</th>
                </tr>
              </thead>
              <tbody>
                {data.map((row, i) => (
                  <tr key={i}>
                    <td style={styles.td}>{formatJalaliDateEn(row.date)}</td>
                    <td style={styles.tdRight}>{formatCurrency(row.expense, currency, locale)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </motion.div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  container: { display: 'flex', gap: spacing.xxl, padding: padding.page },
  sidebar: { width: '320px', minWidth: '280px', display: 'flex', flexDirection: 'column', gap: spacing.lg },
  chartArea: { flex: 1, minWidth: 0 },
  title: { fontSize: fontSize.xxl, fontWeight: fontWeight.semibold, margin: 0, color: colors.text.primary },
  chartToolbar: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  chartTypes: { display: 'flex', gap: spacing.xs },
  chartTypeBtn: { padding: '6px 12px', fontSize: fontSize.sm, border: `${borderWidth.default} solid ${colors.border.strong}`, borderRadius: borderRadius.sm, cursor: 'pointer' },
  generateBtn: {
    padding: padding.buttonLg,
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    color: colors.text.inverse,
    backgroundColor: colors.primary,
    border: 'none',
    borderRadius: borderRadius.md,
    cursor: 'pointer',
  },
  noData: { padding: spacing.huge, textAlign: 'center', color: colors.text.disabled, fontSize: fontSize.base },
  hint: { padding: spacing.huge, textAlign: 'center', color: colors.text.placeholder, fontSize: fontSize.base },
  table: { marginTop: spacing.lg, overflowX: 'auto' },
  th: { padding: padding.tableCell, textAlign: 'left', fontWeight: fontWeight.semibold, color: colors.text.muted, borderBottom: `${borderWidth.thick} solid ${colors.border.divider}`, fontSize: fontSize.sm },
  thRight: { padding: padding.tableCell, textAlign: 'right', fontWeight: fontWeight.semibold, color: colors.text.muted, borderBottom: `${borderWidth.thick} solid ${colors.border.divider}`, fontSize: fontSize.sm },
  td: { padding: padding.tableCellSm, borderBottom: `${borderWidth.default} solid ${colors.border.light}`, fontSize: fontSize.md },
  tdRight: { padding: padding.tableCellSm, borderBottom: `${borderWidth.default} solid ${colors.border.light}`, textAlign: 'right', fontSize: fontSize.md },
}

export default CustomReportBuilderPage
