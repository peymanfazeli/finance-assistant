import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { useAppStore } from '../../core/store/useAppStore'
import { DashboardCardId } from '../../core/models/types'
import { DashboardPeriod, resolveDashboardPeriod } from '../../core/utils/dashboardPeriod'
import { getTodayJalali } from '../../core/utils/jalali'
import { StatsService } from '../../core/services/StatsService'
import { colors, spacing, fontSize, fontWeight, borderRadius, padding, shadow, borderWidth } from '../../core/utils/styles'
import SummaryCardGrid from '../components/SummaryCardGrid'
import ExpenseByCategoryChart from '../components/ExpenseByCategoryChart'
import DashboardCustomizationDialog from '../components/DashboardCustomizationDialog'
import Modal from '../components/Modal'
import TransactionForm from '../components/TransactionForm'
import useReducedMotion from '../hooks/useReducedMotion'

function DashboardPage(): JSX.Element {
  const { t, i18n } = useTranslation()
  const {
    stats, visibleCards, setVisibleCards, dataset,
    showFinancialDetails, setShowFinancialDetails,
    dashboardPeriod, setDashboardPeriod,
    addTransaction
  } = useAppStore()
  const locale = i18n.language === 'fa' ? 'fa-IR' : 'en-US'
  const currency = dataset?.currency || 'toman'
  const [showCustomize, setShowCustomize] = useState(false)
  const [showQuickAdd, setShowQuickAdd] = useState(false)
  const prefersReduced = useReducedMotion()

  const transactions = dataset?.transactions ?? []

  const { periodStats, isFiltered, hasPeriodData, periodLabelKey, periodTransactions } = useMemo(() => {
    const { from, to } = resolveDashboardPeriod(dashboardPeriod, getTodayJalali())
    const filtered = from || to
      ? transactions.filter((tr) => (!from || tr.date >= from) && (!to || tr.date <= to))
      : transactions
    return {
      periodStats: StatsService.calculate(filtered),
      isFiltered: Boolean(from || to),
      hasPeriodData: filtered.length > 0,
      periodLabelKey: `dashboard.period.${dashboardPeriod.preset}`,
      periodTransactions: filtered
    }
  }, [transactions, dashboardPeriod])

  const handleToggle = (cardId: DashboardCardId): void => {
    const updated = visibleCards.includes(cardId)
      ? visibleCards.filter((id) => id !== cardId)
      : [...visibleCards, cardId]
    setVisibleCards(updated)
  }

  const handlePeriodChange = (period: DashboardPeriod): void => {
    setDashboardPeriod(period)
  }

  const hasNoData = stats.transactionCount === 0
  const netBalancePositive = periodStats.netBalance >= 0
  const categories = dataset?.categories ?? []
  const categoryTypeMap = dataset?.categoryTypeMap

  const sectionVariants = {
    hidden: { opacity: 0, y: 16 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.35, ease: 'easeOut' },
    },
  }

  const containerVariants = {
    hidden: { opacity: 1 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: prefersReduced ? 0 : 0.08,
        delayChildren: prefersReduced ? 0 : 0.05,
      },
    },
  }

  return (
    <div style={styles.page}>
      <motion.div
        style={styles.container}
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div variants={prefersReduced ? undefined : sectionVariants}>
          <div style={styles.header}>
            <div style={styles.headerLeft}>
              <h2 style={styles.title}>{t('dashboard.title')}</h2>
              <p style={styles.subtitle}>
                {periodStats.transactionCount > 0
                  ? `${showFinancialDetails ? periodStats.transactionCount : '***'} transactions`
                  : isFiltered
                    ? t('dashboard.period.noTransactions')
                    : t('dashboard.noTransactions')
                }
              </p>
            </div>
            <div style={styles.headerActions}>
              {isFiltered && (
                <span style={styles.periodChip}>
                  {t(periodLabelKey)}
                </span>
              )}
              <motion.button
                style={styles.eyeToggle}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowFinancialDetails(!showFinancialDetails)}
                title={showFinancialDetails ? t('dashboard.hideAmounts') : t('dashboard.showAmounts')}
              >
                {showFinancialDetails ? EyeOpenIcon : EyeClosedIcon}
              </motion.button>
              <motion.button
                style={styles.customizeBtn}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowCustomize(true)}
              >
                {t('dashboard.customize')}
              </motion.button>
            </div>
          </div>
        </motion.div>

        {hasNoData ? (
          <motion.div
            variants={prefersReduced ? undefined : sectionVariants}
            style={styles.emptyCard}
          >
            <motion.div
              style={styles.emptyIconArea}
              initial={prefersReduced ? {} : { scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
            >
              📊
            </motion.div>
            <h3 style={styles.emptyTitle}>{t('dashboard.noDataTitle')}</h3>
            <p style={styles.emptyText}>{t('dashboard.noDataDescription')}</p>
            <div style={styles.emptyActions}>
              <motion.button
                style={styles.emptyPrimaryBtn}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => setShowQuickAdd(true)}
              >
                {t('dashboard.addTransaction')}
              </motion.button>
            </div>
          </motion.div>
        ) : (
          <>
            <motion.div
              variants={prefersReduced ? undefined : sectionVariants}
              style={{
                ...styles.heroCard,
                background: netBalancePositive
                  ? 'linear-gradient(135deg, #f0faf0 0%, #f8fff8 100%)'
                  : 'linear-gradient(135deg, #fef2f2 0%, #fff5f5 100%)',
                borderColor: netBalancePositive ? '#d4edda' : '#f5c6cb',
              }}
            >
              <div style={styles.heroHeader}>
                <span style={styles.heroLabel}>{t('dashboard.netBalance')}</span>
                <span style={{
                  ...styles.heroDot,
                  backgroundColor: netBalancePositive ? colors.success : colors.danger,
                }} />
              </div>
              <motion.span
                key={showFinancialDetails ? `val-${periodStats.netBalance}` : 'val-hidden'}
                style={{
                  ...styles.heroValue,
                  color: netBalancePositive ? colors.text.income : colors.text.expense,
                }}
                initial={prefersReduced ? {} : { opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, ease: 'easeOut' }}
              >
                {showFinancialDetails
                  ? `${periodStats.netBalance >= 0 ? '+' : ''}${formatCurrencyCompact(periodStats.netBalance, currency, locale)}`
                  : '***'
                }
              </motion.span>
            </motion.div>

            {isFiltered && !hasPeriodData && (
              <motion.div
                variants={prefersReduced ? undefined : sectionVariants}
                style={styles.periodEmpty}
              >
                <span style={styles.periodEmptyIcon}>🗓️</span>
                <span>{t('dashboard.period.noTransactions')}</span>
              </motion.div>
            )}

            <motion.div variants={prefersReduced ? undefined : sectionVariants}>
              <SummaryCardGrid stats={periodStats} visibleCards={visibleCards} currency={currency} locale={locale} showFinancialDetails={showFinancialDetails} />
            </motion.div>

            {visibleCards.includes('expenseByCategoryPercent') && (
              <motion.div variants={prefersReduced ? undefined : sectionVariants}>
                <ExpenseByCategoryChart
                  transactions={periodTransactions}
                  categories={categories}
                  totalIncome={periodStats.totalIncome}
                  currency={currency}
                  locale={locale}
                  isMasked={!showFinancialDetails}
                />
              </motion.div>
            )}
          </>
        )}
      </motion.div>

      {!hasNoData && (
        <motion.button
          style={styles.fab}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setShowQuickAdd(true)}
          title={t('dashboard.quickAdd')}
          initial={prefersReduced ? {} : { scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.4, type: 'spring', damping: 20, stiffness: 300 }}
        >
          +
        </motion.button>
      )}

      <DashboardCustomizationDialog
        open={showCustomize}
        visibleCards={visibleCards}
        period={dashboardPeriod}
        onPeriodChange={handlePeriodChange}
        onToggle={handleToggle}
        onClose={() => setShowCustomize(false)}
      />

      {showQuickAdd && (
        <Modal open={showQuickAdd} onClose={() => setShowQuickAdd(false)} title={t('transaction.add')}>
          <TransactionForm
            categories={categories}
            categoryTypeMap={categoryTypeMap}
            onSave={(data) => {
              addTransaction(data)
              setShowQuickAdd(false)
            }}
            onCancel={() => setShowQuickAdd(false)}
          />
        </Modal>
      )}
    </div>
  )
}

const EyeOpenIcon = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
)

const EyeClosedIcon = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
    <line x1="1" y1="1" x2="23" y2="23" />
  </svg>
)

function formatCurrencyCompact(value: number, currency: string, locale: string): string {
  if (currency === 'toman') {
    const abs = Math.abs(value)
    if (abs >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1)} milliard تومان`
    if (abs >= 1_000_000) return `${(value / 1_000_000).toFixed(1)} میلیون تومان`
    if (abs >= 1_000) return `${(value / 1_000).toFixed(1)} هزار تومان`
    return `${value} تومان`
  }
  return new Intl.NumberFormat(locale, { style: 'currency', currency: currency === 'toman' ? 'IRR' : currency.toUpperCase() }).format(value)
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    height: '100%',
    overflow: 'auto',
    padding: spacing.xxl,
    position: 'relative',
  },
  container: {
    maxWidth: '900px',
    margin: '0 auto',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.xxl,
  },
  headerLeft: {
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
  headerActions: {
    display: 'flex',
    alignItems: 'center',
    gap: spacing.sm,
  },
  periodChip: {
    padding: `${spacing.xs} ${spacing.md}`,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.primary,
    backgroundColor: colors.bg.active,
    border: `${borderWidth.default} solid ${colors.primary}`,
    borderRadius: borderRadius.full,
    whiteSpace: 'nowrap',
  },
  eyeToggle: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '36px',
    height: '36px',
    padding: 0,
    color: colors.text.muted,
    backgroundColor: colors.bg.muted,
    border: `${borderWidth.default} solid ${colors.border.light}`,
    borderRadius: borderRadius.md,
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },
  customizeBtn: {
    padding: `${spacing.sm} ${spacing.lg}`,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.text.muted,
    backgroundColor: colors.bg.muted,
    border: `${borderWidth.default} solid ${colors.border.light}`,
    borderRadius: borderRadius.md,
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },
  heroCard: {
    borderRadius: borderRadius.xl,
    border: `${borderWidth.thick} solid`,
    padding: `${spacing.xl} ${spacing.xxl}`,
    marginBottom: spacing.xl,
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.xs,
    boxShadow: shadow.hero,
  },
  heroHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: spacing.sm,
  },
  heroDot: {
    width: '8px',
    height: '8px',
    borderRadius: borderRadius.full,
  },
  heroLabel: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.text.disabled,
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  heroValue: {
    fontSize: fontSize.hero,
    fontWeight: fontWeight.bold,
    fontVariantNumeric: 'tabular-nums',
  },
  emptyCard: {
    backgroundColor: colors.bg.card,
    borderRadius: borderRadius.lg,
    border: `${borderWidth.default} solid ${colors.border.light}`,
    padding: `${spacing.massive} ${spacing.xxxl}`,
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: spacing.md,
    boxShadow: shadow.card,
  },
  emptyIconArea: {
    fontSize: '48px',
    lineHeight: 1,
    marginBottom: spacing.sm,
  },
  emptyTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    margin: 0,
    color: colors.text.primary,
  },
  emptyText: {
    fontSize: fontSize.sm,
    color: colors.text.disabled,
    margin: 0,
    maxWidth: '360px',
    lineHeight: '1.5',
  },
  emptyActions: {
    display: 'flex',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  periodEmpty: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    padding: `${spacing.sm} ${spacing.md}`,
    marginBottom: spacing.xl,
    fontSize: fontSize.sm,
    color: colors.text.warning,
    backgroundColor: colors.bg.warning,
    borderRadius: borderRadius.md,
    border: `${borderWidth.default} solid ${colors.border.default}`,
  },
  periodEmptyIcon: {
    fontSize: '16px',
    lineHeight: 1,
  },
  emptyPrimaryBtn: {
    padding: `${spacing.sm} ${spacing.xl}`,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.text.inverse,
    backgroundColor: colors.primary,
    border: 'none',
    borderRadius: borderRadius.md,
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },
  fab: {
    position: 'fixed',
    bottom: spacing.xxl,
    right: spacing.xxl,
    width: '48px',
    height: '48px',
    padding: 0,
    fontSize: '22px',
    fontWeight: fontWeight.bold,
    color: colors.text.inverse,
    backgroundColor: colors.primary,
    border: 'none',
    borderRadius: borderRadius.full,
    cursor: 'pointer',
    boxShadow: shadow.dropdown,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    lineHeight: 1,
    zIndex: 100,
  },
}

export default DashboardPage
