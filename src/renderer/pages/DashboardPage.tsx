import { useState } from 'react'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { useAppStore } from '../../core/store/useAppStore'
import { DashboardCardId } from '../../core/models/types'
import { colors, spacing, fontSize, fontWeight, borderRadius, padding, borderWidth } from '../../core/utils/styles'
import SummaryCardGrid from '../components/SummaryCardGrid'
import DashboardCustomizationDialog from '../components/DashboardCustomizationDialog'

function DashboardPage(): JSX.Element {
  const { t, i18n } = useTranslation()
  const { stats, visibleCards, setVisibleCards, dataset } = useAppStore()
  const locale = i18n.language === 'fa' ? 'fa-IR' : 'en-US'
  const currency = dataset?.currency || 'USD'
  const [showCustomize, setShowCustomize] = useState(false)

  const handleToggle = (cardId: DashboardCardId): void => {
    const updated = visibleCards.includes(cardId)
      ? visibleCards.filter((id) => id !== cardId)
      : [...visibleCards, cardId]
    setVisibleCards(updated)
  }

  const hasNoData = stats.transactionCount === 0

  return (
    <motion.div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>{t('dashboard.title')}</h2>
        <motion.button
          style={styles.customizeBtn}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => setShowCustomize(true)}
        >
          {t('dashboard.customize')}
        </motion.button>
      </div>

      {hasNoData ? (
        <div style={styles.empty}>
          <p>{t('dashboard.noTransactions')}</p>
        </div>
      ) : (
        <SummaryCardGrid stats={stats} visibleCards={visibleCards} currency={currency} locale={locale} />
      )}

      <DashboardCustomizationDialog
        open={showCustomize}
        visibleCards={visibleCards}
        onToggle={handleToggle}
        onClose={() => setShowCustomize(false)}
      />
    </motion.div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  container: { padding: padding.page },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  title: { fontSize: fontSize.xxl, fontWeight: fontWeight.semibold, margin: 0, color: colors.text.primary },
  customizeBtn: {
    padding: '8px 14px',
    fontSize: fontSize.md,
    color: colors.primary,
    backgroundColor: colors.bg.card,
    border: `${borderWidth.default} solid ${colors.primary}`,
    borderRadius: borderRadius.md,
    cursor: 'pointer',
  },
  empty: {
    padding: `${spacing.massive} ${spacing.xxl}`,
    textAlign: 'center',
    color: colors.text.disabled,
    fontSize: fontSize.base,
  },
}

export default DashboardPage
