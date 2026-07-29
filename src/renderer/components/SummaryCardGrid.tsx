import { motion } from 'framer-motion'
import { DashboardStats, DashboardCardId } from '../../core/models/types'
import SummaryCard from './SummaryCard'
import { formatCurrency } from '../../core/utils/format'
import { spacing, borderRadius, colors, borderWidth } from '../../core/utils/styles'
import { useTranslation } from 'react-i18next'
import useReducedMotion from '../hooks/useReducedMotion'

interface SummaryCardConfig {
  id: DashboardCardId
  titleKey: string
  color: string
  icon: string
  getValue: (stats: DashboardStats, currency: string, locale: string) => string
}

function createCardConfigs(currency: string, locale: string): SummaryCardConfig[] {
  const fmt = (amount: number): string => formatCurrency(amount, currency, locale)
  return [
    {
      id: 'totalIncome',
      titleKey: 'dashboard.totalIncome',
      color: colors.text.income,
      icon: '💰',
      getValue: (s) => fmt(s.totalIncome)
    },
    {
      id: 'totalExpenses',
      titleKey: 'dashboard.totalExpenses',
      color: colors.text.expense,
      icon: '💸',
      getValue: (s) => fmt(s.totalExpenses)
    },
    {
      id: 'transactionCount',
      titleKey: 'dashboard.transactionCount',
      color: colors.primary,
      icon: '📋',
      getValue: (s) => String(s.transactionCount)
    },
    {
      id: 'avgDailySpending',
      titleKey: 'dashboard.avgDailySpending',
      color: colors.text.investment,
      icon: '☕',
      getValue: (s) => fmt(s.avgDailySpending)
    },
    {
      id: 'avgWeeklySpending',
      titleKey: 'dashboard.avgWeeklySpending',
      color: colors.text.refund,
      icon: '📅',
      getValue: (s) => fmt(s.avgWeeklySpending)
    },
  ]
}

interface SummaryCardGridProps {
  stats: DashboardStats
  visibleCards: DashboardCardId[]
  currency?: string
  locale?: string
  showFinancialDetails?: boolean
}

function SummaryCardGrid({ stats, visibleCards, currency = 'toman', locale = 'en-US', showFinancialDetails = false }: SummaryCardGridProps): JSX.Element {
  const { t } = useTranslation()
  const prefersReduced = useReducedMotion()
  const CARD_CONFIGS = createCardConfigs(currency, locale)
  const visible = CARD_CONFIGS.filter((c) => visibleCards.includes(c.id))

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: prefersReduced ? 0 : 0.05,
        delayChildren: prefersReduced ? 0 : 0.1,
      },
    },
  }

  const cardVariants = {
    hidden: { opacity: 0, y: 12 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.3, ease: 'easeOut' },
    },
  }

  return (
    <motion.div
      style={styles.grid}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {visible.map((card) => (
        <motion.div key={card.id} variants={cardVariants}>
          <SummaryCard
            title={t(card.titleKey)}
            value={card.getValue(stats, currency, locale)}
            color={card.color}
            icon={card.icon}
            isMasked={!showFinancialDetails}
          />
        </motion.div>
      ))}
    </motion.div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
    gap: spacing.lg,
  }
}

export default SummaryCardGrid
