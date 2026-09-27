import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { useAppStore } from '../../core/store/useAppStore'
import { Transaction, TransactionType } from '../../core/models/types'
import { resolveDashboardPeriod } from '../../core/utils/dashboardPeriod'
import { JalaliDate } from '../../core/utils/jalali'
import { formatCurrency } from '../../core/utils/format'
import { colors, spacing, fontSize, fontWeight, borderRadius, padding, shadow, borderWidth } from '../../core/utils/styles'
import useReducedMotion from '../hooks/useReducedMotion'
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import BudgetAmountDialog from '../components/BudgetAmountDialog'

export function getMonthIncomeBase(transactions: Transaction[], today?: JalaliDate): number {
  const { from, to } = resolveDashboardPeriod({ preset: 'thisMonth' }, today)
  return transactions
    .filter((tr) => (!from || tr.date >= from) && (!to || tr.date <= to))
    .filter((tr) => tr.type === TransactionType.Income || tr.type === TransactionType.Refund)
    .reduce((sum, tr) => sum + tr.amount, 0)
}

const SAVE_DEBOUNCE_MS = 400

// Income-side and leftover categories. They stay in the dataset for transactions,
// but you budget *where* money goes, not where it comes from. Edit this list freely.
const NON_BUDGETABLE = new Set(['Salary', 'Project', 'Investment', 'MustNot', 'Bullshit'])

function BudgetPage(): JSX.Element {
  const { t, i18n } = useTranslation()
  const { dataset, setBudgetPercentages } = useAppStore()
  const locale = i18n.language === 'fa' ? 'fa-IR' : 'en-US'
  const currency = dataset?.currency || 'toman'
  const prefersReduced = useReducedMotion()

  const categories = useMemo(
    () => (dataset?.categories ?? []).filter((c) => !NON_BUDGETABLE.has(c.name)),
    [dataset?.categories]
  )
  const transactions = dataset?.transactions ?? []
  const stored = useMemo(() => dataset?.budgetPercentages ?? {}, [dataset?.budgetPercentages])

  const [draft, setDraft] = useState<Record<string, number>>(stored)
  const [showAmounts, setShowAmounts] = useState(false)

  useEffect(() => {
    setDraft(stored)
  }, [stored])

  useEffect(() => {
    if (draft === stored) return
    const timer = window.setTimeout(() => setBudgetPercentages(draft), SAVE_DEBOUNCE_MS)
    return () => window.clearTimeout(timer)
  }, [draft, stored, setBudgetPercentages])

  const base = useMemo(() => getMonthIncomeBase(transactions), [transactions])

  const percentOf = (id: string): number => draft[id] ?? 0

  const handleChange = (id: string, value: number): void => {
    setDraft((prev) => {
      const next = { ...prev }
      if (value > 0) next[id] = value
      else delete next[id]
      return next
    })
  }

  const rows = useMemo(
    () =>
      categories
        .filter((c) => percentOf(c.id) > 0)
        .sort((a, b) => percentOf(b.id) - percentOf(a.id)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [categories, draft]
  )

  const totalPercent = rows.reduce((sum, c) => sum + percentOf(c.id), 0)
  const totalAmount = (base * totalPercent) / 100

  const pieData = useMemo(() => {
    const slices = rows.map((c) => ({ name: c.name, value: percentOf(c.id), color: c.color }))
    if (totalPercent < 100) {
      slices.push({ name: t('budget.remaining'), value: 100 - totalPercent, color: colors.border.default })
    }
    return slices
  }, [rows, draft, totalPercent, t])

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div>
          <h2 style={styles.title}>{t('budget.title')}</h2>
          <p style={styles.subtitle}>{t('budget.subtitle')}</p>
        </div>
        <button style={styles.amountsBtn} onClick={() => setShowAmounts(true)}>
          {t('budget.enterAmounts')}
        </button>
      </div>

      <div style={styles.summaryRow}>
        <div style={styles.summaryCard}>
          <span style={styles.summaryLabel}>{t('budget.monthBase')}</span>
          <span style={styles.summaryValue}>{formatCurrency(base, currency, locale)}</span>
        </div>
        <div style={styles.summaryCard}>
          <span style={styles.summaryLabel}>{t('budget.allocated')}</span>
          <span style={styles.summaryValue}>
            {Math.round(totalPercent)}% · {formatCurrency(totalAmount, currency, locale)}
          </span>
        </div>
        <div style={styles.summaryCard}>
          <span style={styles.summaryLabel}>
            {totalPercent > 100 ? t('budget.overAllocated') : t('budget.remaining')}
          </span>
          <span
            style={{
              ...styles.summaryValue,
              color: totalPercent > 100 ? colors.text.error : colors.text.income,
            }}
          >
            {formatCurrency((base * Math.abs(100 - totalPercent)) / 100, currency, locale)}
          </span>
        </div>
      </div>

      <motion.div
        style={styles.card}
        initial={prefersReduced ? false : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
      >
        {categories.length === 0 ? (
          <div style={styles.empty}>{t('common.noData')}</div>
        ) : (
          <div style={styles.sliderScroll}>
            {categories.map((category) => (
              <div key={category.id} style={styles.sliderRow}>
                <span style={styles.sliderLabel}>
                  <span style={{ ...styles.swatch, backgroundColor: category.color }} />
                  {category.icon} {category.name}
                </span>
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={1}
                  value={percentOf(category.id)}
                  onChange={(e) => handleChange(category.id, Number(e.target.value))}
                  aria-label={`${category.name} — ${t('budget.percent')}`}
                  style={{ ...styles.slider, accentColor: category.color }}
                />
                <span style={styles.sliderValue}>
                  {percentOf(category.id)}% ·{' '}
                  {formatCurrency((base * percentOf(category.id)) / 100, currency, locale)}
                </span>
              </div>
            ))}
          </div>
        )}
      </motion.div>

      <div style={styles.card}>
        {rows.length === 0 ? (
          <div style={styles.empty}>{t('budget.noAllocations')}</div>
        ) : (
          <div style={styles.chartScroll}>
            <ResponsiveContainer width="100%" height={440}>
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={110} label>
                  {pieData.map((slice, i) => (
                    <Cell key={i} fill={slice.color ?? colors.chart[i % colors.chart.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value) => `${value}%`}
                  contentStyle={{ fontSize: fontSize.sm, borderRadius: borderRadius.md }}
                />
                <Legend wrapperStyle={{ fontSize: fontSize.sm }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {rows.length > 0 && (
        <div style={styles.card}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>{t('budget.category')}</th>
                <th style={styles.thRight}>{t('budget.percent')}</th>
                <th style={styles.thRight}>{t('budget.amount')}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((category, i) => (
                <tr key={category.id} style={i % 2 === 1 ? styles.rowOdd : undefined}>
                  <td style={styles.td}>
                    <span style={{ ...styles.swatch, backgroundColor: category.color }} />
                    {category.icon} {category.name}
                  </td>
                  <td style={styles.tdRight}>{percentOf(category.id)}%</td>
                  <td style={styles.tdRight}>
                    {formatCurrency((base * percentOf(category.id)) / 100, currency, locale)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td style={styles.tf}>{t('budget.total')}</td>
                <td style={{ ...styles.tf, ...styles.tdRight }}>{Math.round(totalPercent)}%</td>
                <td style={{ ...styles.tf, ...styles.tdRight }}>
                  {formatCurrency(totalAmount, currency, locale)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      {showAmounts && (
        <BudgetAmountDialog
          categories={categories}
          base={base}
          currency={currency}
          locale={locale}
          percentOf={percentOf}
          onSave={setDraft}
          onClose={() => setShowAmounts(false)}
        />
      )}
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  page: { padding: padding.page, height: '100%', boxSizing: 'border-box', overflowY: 'auto' },
  header: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.lg,
    marginBottom: spacing.lg,
  },
  amountsBtn: {
    padding: padding.button,
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    color: colors.text.inverse,
    backgroundColor: colors.primary,
    border: 'none',
    borderRadius: borderRadius.md,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  },
  title: { margin: 0, fontSize: fontSize.xxl, fontWeight: fontWeight.semibold, color: colors.text.primary },
  subtitle: { margin: `${spacing.xs} 0 0 0`, fontSize: fontSize.base, color: colors.text.subtle },
  summaryRow: { display: 'flex', gap: spacing.lg, flexWrap: 'wrap', marginBottom: spacing.lg },
  summaryCard: {
    flex: 1,
    minWidth: '180px',
    padding: padding.card,
    backgroundColor: colors.bg.card,
    borderRadius: borderRadius.lg,
    boxShadow: shadow.card,
    border: `${borderWidth.default} solid ${colors.border.default}`,
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.xs,
  },
  summaryLabel: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
    color: colors.text.muted,
  },
  summaryValue: { fontSize: fontSize.lg, fontWeight: fontWeight.semibold, color: colors.text.primary },
  card: {
    padding: padding.card,
    marginBottom: spacing.lg,
    backgroundColor: colors.bg.card,
    borderRadius: borderRadius.lg,
    boxShadow: shadow.card,
    border: `${borderWidth.default} solid ${colors.border.default}`,
  },
  sliderScroll: {
    maxHeight: '360px',
    overflowY: 'auto',
    overflowX: 'hidden',
    paddingInlineEnd: spacing.xs,
  },
  chartScroll: {
    maxHeight: '70vh',
    overflowY: 'auto',
    overflowX: 'hidden',
  },
  sliderRow: {
    display: 'flex',
    alignItems: 'center',
    gap: spacing.lg,
    padding: `${spacing.sm} 0`,
    borderBottom: `${borderWidth.default} solid ${colors.border.divider}`,
  },
  sliderLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: spacing.sm,
    width: '220px',
    fontSize: fontSize.base,
    color: colors.text.primary,
  },
  swatch: {
    display: 'inline-block',
    width: '10px',
    height: '10px',
    borderRadius: borderRadius.sm,
    marginInlineEnd: spacing.sm,
    flexShrink: 0,
  },
  slider: { flex: 1, height: '20px', cursor: 'pointer' },
  sliderValue: {
    width: '200px',
    textAlign: 'end' as const,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.text.muted,
    fontVariantNumeric: 'tabular-nums',
  },
  empty: { padding: spacing.xl, textAlign: 'center' as const, color: colors.text.disabled },
  table: { width: '100%', borderCollapse: 'collapse' as const },
  th: {
    padding: padding.tableCell,
    textAlign: 'start' as const,
    fontWeight: fontWeight.semibold,
    fontSize: fontSize.xs,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
    color: colors.text.muted,
    backgroundColor: colors.bg.muted,
    borderBottom: `${borderWidth.thick} solid ${colors.border.divider}`,
  },
  thRight: {
    padding: padding.tableCell,
    textAlign: 'end' as const,
    fontWeight: fontWeight.semibold,
    fontSize: fontSize.xs,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
    color: colors.text.muted,
    backgroundColor: colors.bg.muted,
    borderBottom: `${borderWidth.thick} solid ${colors.border.divider}`,
  },
  td: {
    padding: padding.tableCell,
    fontSize: fontSize.base,
    color: colors.text.primary,
    borderBottom: `${borderWidth.default} solid ${colors.border.light}`,
  },
  tdRight: {
    padding: padding.tableCell,
    fontSize: fontSize.base,
    color: colors.text.primary,
    borderBottom: `${borderWidth.default} solid ${colors.border.light}`,
    textAlign: 'end' as const,
    fontVariantNumeric: 'tabular-nums',
  },
  rowOdd: { backgroundColor: colors.bg.muted },
  tf: {
    padding: padding.tableCell,
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    color: colors.text.primary,
    borderTop: `${borderWidth.thick} solid ${colors.border.divider}`,
  },
}

export default BudgetPage
