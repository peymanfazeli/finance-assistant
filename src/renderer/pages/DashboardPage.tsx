import { useState } from 'react'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { useAppStore } from '../../core/store/useAppStore'
import { DashboardCardId } from '../../core/models/types'
import { colors, spacing, fontSize, fontWeight, borderRadius, padding, shadow, borderWidth } from '../../core/utils/styles'
import SummaryCardGrid from '../components/SummaryCardGrid'
import DashboardCustomizationDialog from '../components/DashboardCustomizationDialog'

function DashboardPage(): JSX.Element {
  const { t, i18n } = useTranslation()
  const { stats, visibleCards, setVisibleCards, dataset } = useAppStore()
  const locale = i18n.language === 'fa' ? 'fa-IR' : 'en-US'
  const currency = dataset?.currency || 'toman'
  const [showCustomize, setShowCustomize] = useState(false)

  const handleToggle = (cardId: DashboardCardId): void => {
    const updated = visibleCards.includes(cardId)
      ? visibleCards.filter((id) => id !== cardId)
      : [...visibleCards, cardId]
    setVisibleCards(updated)
  }

  const hasNoData = stats.transactionCount === 0
  const netBalancePositive = stats.netBalance > 0

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <div style={styles.header}>
          <div style={styles.headerLeft}>
            <h2 style={styles.title}>{t('dashboard.title')}</h2>
            <p style={styles.subtitle}>
              {stats.transactionCount > 0
                ? `${stats.transactionCount} transactions`
                : t('dashboard.noTransactions')
              }
            </p>
          </div>
          <motion.button
            style={styles.customizeBtn}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowCustomize(true)}
          >
            {t('dashboard.customize')}
          </motion.button>
        </div>

        {hasNoData ? (
          <div style={styles.emptyCard}>
            <div style={styles.emptyIcon}>📊</div>
            <h3 style={styles.emptyTitle}>No Data Yet</h3>
            <p style={styles.emptyText}>{t('dashboard.noTransactions')}</p>
          </div>
        ) : (
          <>
            <div style={styles.netBalanceCard}>
              <div style={styles.netBalanceHeader}>
                <span style={styles.netBalanceLabel}>{t('dashboard.netBalance')}</span>
                <span style={{
                  ...styles.netBalanceDot,
                  backgroundColor: netBalancePositive ? colors.success : colors.danger,
                }} />
              </div>
              <span style={{
                ...styles.netBalanceValue,
                color: netBalancePositive ? colors.text.income : colors.text.expense,
              }}>
                {stats.netBalance >= 0 ? '+' : ''}{formatCurrencyCompact(stats.netBalance, currency, locale)}
              </span>
            </div>

            <SummaryCardGrid stats={stats} visibleCards={visibleCards} currency={currency} locale={locale} />
          </>
        )}
      </div>

      <DashboardCustomizationDialog
        open={showCustomize}
        visibleCards={visibleCards}
        onToggle={handleToggle}
        onClose={() => setShowCustomize(false)}
      />
    </div>
  )
}

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
  netBalanceCard: {
    backgroundColor: colors.bg.card,
    borderRadius: borderRadius.lg,
    border: `${borderWidth.default} solid ${colors.border.light}`,
    padding: `${spacing.xl} ${spacing.xxl}`,
    marginBottom: spacing.xl,
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.xs,
  },
  netBalanceHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: spacing.sm,
  },
  netBalanceDot: {
    width: '8px',
    height: '8px',
    borderRadius: borderRadius.full,
  },
  netBalanceLabel: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.text.disabled,
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  netBalanceValue: {
    fontSize: fontSize.display,
    fontWeight: fontWeight.bold,
    fontVariantNumeric: 'tabular-nums',
  },
  emptyCard: {
    backgroundColor: colors.bg.card,
    borderRadius: borderRadius.lg,
    border: `${borderWidth.default} solid ${colors.border.light}`,
    padding: `${spacing.huge} ${spacing.xxxl}`,
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: spacing.sm,
  },
  emptyIcon: {
    fontSize: '40px',
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
}

export default DashboardPage
