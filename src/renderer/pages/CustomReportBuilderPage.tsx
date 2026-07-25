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
import { colors, spacing, fontSize, fontWeight, borderRadius, padding, shadow, borderWidth } from '../../core/utils/styles'
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
    if (!generated) {
      return (
        <div style={styles.emptyState}>
          <span style={styles.emptyIcon}>📈</span>
          <p style={styles.emptyText}>{t('reports.enterKeyword')}</p>
          <p style={styles.emptyHint}>{t('customReport.generate')}</p>
        </div>
      )
    }
    if (!hasData) {
      return (
        <div style={styles.emptyState}>
          <span style={styles.emptyIcon}>📭</span>
          <p style={styles.emptyText}>{t('customReport.noData')}</p>
        </div>
      )
    }

    const commonProps = { data, margin: { top: 10, right: 30, left: 0, bottom: 0 } }

    switch (chartType) {
      case 'line':
        return (
          <ResponsiveContainer width="100%" height={340}>
            <LineChart {...commonProps}>
              <CartesianGrid strokeDasharray="3 3" stroke={colors.border.divider} />
              <XAxis dataKey="date" fontSize={12} tickFormatter={(d) => formatJalaliDateEn(d)} tick={{ fill: colors.text.muted }} />
              <YAxis fontSize={12} tick={{ fill: colors.text.muted }} tickFormatter={(v) => formatCurrency(v, currency, locale)} />
              <Tooltip formatter={(value: number) => formatCurrency(value, currency, locale)} />
              <Legend />
              <Line type="monotone" dataKey="expense" stroke={colors.primary} name={t('reports.chartType')} strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        )
      case 'area':
        return (
          <ResponsiveContainer width="100%" height={340}>
            <AreaChart {...commonProps}>
              <CartesianGrid strokeDasharray="3 3" stroke={colors.border.divider} />
              <XAxis dataKey="date" fontSize={12} tickFormatter={(d) => formatJalaliDateEn(d)} tick={{ fill: colors.text.muted }} />
              <YAxis fontSize={12} tick={{ fill: colors.text.muted }} tickFormatter={(v) => formatCurrency(v, currency, locale)} />
              <Tooltip formatter={(value: number) => formatCurrency(value, currency, locale)} />
              <Legend />
              <Area type="monotone" dataKey="expense" stroke={colors.primary} fill={colors.bg.active} name={t('reports.chartType')} />
            </AreaChart>
          </ResponsiveContainer>
        )
      default:
        return (
          <ResponsiveContainer width="100%" height={340}>
            <BarChart {...commonProps}>
              <CartesianGrid strokeDasharray="3 3" stroke={colors.border.divider} />
              <XAxis dataKey="date" fontSize={12} tickFormatter={(d) => formatJalaliDateEn(d)} tick={{ fill: colors.text.muted }} />
              <YAxis fontSize={12} tick={{ fill: colors.text.muted }} tickFormatter={(v) => formatCurrency(v, currency, locale)} />
              <Tooltip formatter={(value: number) => formatCurrency(value, currency, locale)} />
              <Legend />
              <Bar dataKey="expense" fill={colors.primary} name={t('reports.chartType')} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )
    }
  }

  return (
    <div style={styles.page}>
      <div style={styles.layout}>
        <aside style={styles.sidebar}>
          <div style={styles.sidebarHeader}>
            <span style={styles.sidebarIcon}>🛠️</span>
            <span style={styles.sidebarTitle}>{t('customReport.builder')}</span>
          </div>

          <div style={styles.configSection}>
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
          </div>

          <div style={styles.configSection}>
            <GroupingSelector
              grouping={grouping}
              aggregation={aggregation}
              onGroupingChange={setGrouping}
              onAggregationChange={setAggregation}
            />
          </div>

          <div style={styles.sidebarFooter}>
            <motion.button
              style={styles.generateBtn}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleGenerate}
            >
              {t('customReport.generate')}
            </motion.button>
          </div>
        </aside>

        <div style={styles.main}>
          <div style={styles.mainHeader}>
            <div>
              <h2 style={styles.title}>{t('customReport.title')}</h2>
              <p style={styles.subtitle}>
                {selectedTypes.length > 0
                  ? selectedTypes.map(type => t(`transaction.${type}`)).join(', ')
                  : t('reports.allByCategory')}
              </p>
            </div>
            <div style={styles.headerActions}>
              <div style={styles.chartTypeBar}>
                {CHART_TYPES.map((ct) => (
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
              {generated && hasData && (
                <ExportButton data={data} filename="custom-report" reportTitle={t('customReport.title')} currency={currency} locale={locale} />
              )}
            </div>
          </div>

          <div style={styles.chartCard}>
            {renderChart()}
          </div>

          {hasData && (
            <div style={styles.tableCard}>
              <div style={styles.tableHeader}>
                <span style={styles.tableTitle}>{t('customReport.title')}</span>
                <span style={styles.tableCount}>{data.length} rows</span>
              </div>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>{t('transaction.date')}</th>
                    <th style={styles.thRight}>{t('reports.chartType')}</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((row, i) => (
                    <tr key={i} style={i % 2 === 0 ? styles.tableRowEven : undefined}>
                      <td style={styles.td}>{formatJalaliDateEn(row.date)}</td>
                      <td style={styles.tdRight}>{formatCurrency(row.expense, currency, locale)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr style={styles.tableFooter}>
                    <td style={{ ...styles.td, fontWeight: fontWeight.semibold }}>Total</td>
                    <td style={{ ...styles.tdRight, fontWeight: fontWeight.semibold }}>
                      {formatCurrency(data.reduce((sum, row) => sum + row.expense, 0), currency, locale)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    height: '100%',
    overflow: 'auto',
  },
  layout: {
    display: 'flex',
    minHeight: '100%',
  },
  sidebar: {
    width: '320px',
    minWidth: '320px',
    backgroundColor: colors.bg.card,
    borderRight: `${borderWidth.default} solid ${colors.border.default}`,
    display: 'flex',
    flexDirection: 'column',
    overflowY: 'auto',
  },
  sidebarHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: spacing.sm,
    padding: `${spacing.lg} ${spacing.lg} ${spacing.md}`,
    borderBottom: `${borderWidth.default} solid ${colors.border.light}`,
  },
  sidebarIcon: {
    fontSize: fontSize.xl,
  },
  sidebarTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.text.primary,
  },
  configSection: {
    padding: spacing.lg,
    borderBottom: `${borderWidth.default} solid ${colors.border.light}`,
  },
  sidebarFooter: {
    padding: spacing.lg,
    marginTop: 'auto',
  },
  generateBtn: {
    width: '100%',
    padding: padding.buttonLg,
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    color: colors.text.inverse,
    backgroundColor: colors.primary,
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
  },
  mainHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.xl,
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
    margin: `${spacing.xs} 0 0`,
  },
  headerActions: {
    display: 'flex',
    gap: spacing.sm,
    alignItems: 'center',
  },
  chartTypeBar: {
    display: 'flex',
    gap: '2px',
    backgroundColor: colors.bg.muted,
    borderRadius: borderRadius.md,
    padding: '3px',
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
  chartCard: {
    backgroundColor: colors.bg.card,
    borderRadius: borderRadius.lg,
    border: `${borderWidth.default} solid ${colors.border.light}`,
    padding: spacing.lg,
    marginBottom: spacing.xl,
  },
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.massive,
    color: colors.text.disabled,
  },
  emptyIcon: {
    fontSize: '48px',
    marginBottom: spacing.md,
  },
  emptyText: {
    fontSize: fontSize.base,
    color: colors.text.muted,
    margin: 0,
  },
  emptyHint: {
    fontSize: fontSize.sm,
    color: colors.text.placeholder,
    margin: `${spacing.xs} 0 0`,
  },
  tableCard: {
    backgroundColor: colors.bg.card,
    borderRadius: borderRadius.lg,
    border: `${borderWidth.default} solid ${colors.border.light}`,
    overflow: 'hidden',
  },
  tableHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: `${spacing.md} ${spacing.lg}`,
    borderBottom: `${borderWidth.default} solid ${colors.border.light}`,
  },
  tableTitle: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    color: colors.text.primary,
  },
  tableCount: {
    fontSize: fontSize.sm,
    color: colors.text.disabled,
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: fontSize.sm,
  },
  th: {
    padding: `${spacing.md} ${spacing.lg}`,
    textAlign: 'left',
    fontWeight: fontWeight.semibold,
    color: colors.text.muted,
    backgroundColor: colors.bg.muted,
    borderBottom: `${borderWidth.thick} solid ${colors.border.divider}`,
    fontSize: fontSize.xs,
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  thRight: {
    padding: `${spacing.md} ${spacing.lg}`,
    textAlign: 'right',
    fontWeight: fontWeight.semibold,
    color: colors.text.muted,
    backgroundColor: colors.bg.muted,
    borderBottom: `${borderWidth.thick} solid ${colors.border.divider}`,
    fontSize: fontSize.xs,
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  td: {
    padding: `${spacing.sm} ${spacing.lg}`,
    borderBottom: `${borderWidth.default} solid ${colors.border.light}`,
    fontSize: fontSize.base,
    color: colors.text.primary,
  },
  tdRight: {
    padding: `${spacing.sm} ${spacing.lg}`,
    borderBottom: `${borderWidth.default} solid ${colors.border.light}`,
    textAlign: 'right',
    fontSize: fontSize.base,
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

export default CustomReportBuilderPage
