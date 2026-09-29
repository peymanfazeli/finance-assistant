import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { Transaction, Category } from '../../core/models/types'
import { ReportService, ReportDataPoint } from '../../core/services/ReportService'
import { formatCurrency } from '../../core/utils/format'
import { colors, spacing, fontSize, fontWeight, borderRadius, borderWidth, shadow, padding } from '../../core/utils/styles'

export interface CategoryPercentRow {
  name: string
  value: number
  percent: number
  color?: string
}

// ponytail: single shared denominator (period income). No income in range => nothing to express as a percent.
export function buildCategoryPercentRows(
  points: ReportDataPoint[],
  income: number
): CategoryPercentRow[] {
  if (income <= 0) return []
  return points
    .map((p) => ({
      name: p.name,
      value: p.value,
      percent: Math.round((p.value / income) * 1000) / 10,
      color: p.color
    }))
    .sort((a, b) => b.value - a.value)
}

interface ExpenseByCategoryChartProps {
  transactions: Transaction[]
  categories: Category[]
  totalIncome: number
  currency?: string
  locale?: string
  isMasked?: boolean
}

function ExpenseByCategoryChart({
  transactions,
  categories,
  totalIncome,
  currency = 'toman',
  locale = 'en-US',
  isMasked = false
}: ExpenseByCategoryChartProps): JSX.Element {
  const { t } = useTranslation()

  const rows = useMemo(
    () => buildCategoryPercentRows(
      ReportService.generate(transactions, categories, 'expenseByCategory') as ReportDataPoint[],
      totalIncome
    ),
    [transactions, categories, totalIncome]
  )

  if (isMasked) {
    return (
      <div style={styles.card}>
        <div style={styles.titleRow}>
          <span style={styles.icon}>🥧</span>
          <span style={styles.title}>{t('dashboard.expenseByCategoryPercent')}</span>
        </div>
        <span style={styles.maskedValue}>***</span>
      </div>
    )
  }

  return (
    <div style={styles.card}>
      <div style={styles.titleRow}>
        <span style={styles.icon}>🥧</span>
        <span style={styles.title}>{t('dashboard.expenseByCategoryPercent')}</span>
      </div>

      {totalIncome <= 0 ? (
        <span style={styles.empty}>{t('dashboard.chart.noIncome')}</span>
      ) : rows.length === 0 ? (
        <span style={styles.empty}>{t('dashboard.chart.noExpenseData')}</span>
      ) : (
        <div style={styles.chartScroll}>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={rows} margin={{ top: 10, right: 20, left: 0, bottom: 40 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={colors.border.divider} />
              <XAxis
                dataKey="name"
                interval={0}
                angle={-30}
                textAnchor="end"
                height={70}
                tick={{ fontSize: fontSize.xs, fill: colors.text.muted }}
              />
              <YAxis
                tick={{ fontSize: fontSize.xs, fill: colors.text.muted }}
                tickFormatter={(v: number) => `${v}%`}
              />
              <Tooltip
                formatter={(_value, _name, item) => {
                  const row = item?.payload as CategoryPercentRow
                  return `${row.percent}% · ${formatCurrency(row.value, currency, locale)}`
                }}
                contentStyle={{ fontSize: fontSize.sm, borderRadius: borderRadius.md }}
              />
              <Bar dataKey="percent" name={t('dashboard.chart.percentOfIncome')} radius={[3, 3, 0, 0]}>
                {rows.map((row, i) => (
                  <Cell key={row.name} fill={row.color ?? colors.chart[i % colors.chart.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  card: {
    background: colors.bg.card,
    border: `${borderWidth.default} solid ${colors.border.default}`,
    borderRadius: borderRadius.lg,
    boxShadow: shadow.card,
    padding: padding.card,
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.md,
    marginTop: spacing.md
  },
  titleRow: {
    display: 'flex',
    alignItems: 'center',
    gap: spacing.sm,
  },
  icon: { fontSize: fontSize.lg },
  title: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    color: colors.text.primary,
  },
  maskedValue: {
    fontSize: fontSize.xxxl,
    fontWeight: fontWeight.bold,
    color: colors.text.primary,
  },
  empty: {
    fontSize: fontSize.base,
    color: colors.text.muted,
  },
  chartScroll: {
    overflowX: 'auto',
  },
}

export default ExpenseByCategoryChart
