import { DashboardStats, DashboardCardId } from '../../core/models/types'
import SummaryCard from './SummaryCard'
import { formatCurrency } from '../../core/utils/format'
import { spacing, borderRadius, colors, borderWidth } from '../../core/utils/styles'
import { useTranslation } from 'react-i18next'

interface SummaryCardConfig {
  id: DashboardCardId
  titleKey: string
  color: string
  getValue: (stats: DashboardStats, currency: string, locale: string) => string
}

function createCardConfigs(currency: string, locale: string): SummaryCardConfig[] {
  const fmt = (amount: number): string => formatCurrency(amount, currency, locale)
  return [
    {
      id: 'totalIncome',
      titleKey: 'dashboard.totalIncome',
      color: colors.text.income,
      getValue: (s) => fmt(s.totalIncome)
    },
    {
      id: 'totalExpenses',
      titleKey: 'dashboard.totalExpenses',
      color: colors.text.expense,
      getValue: (s) => fmt(s.totalExpenses)
    },
    {
      id: 'transactionCount',
      titleKey: 'dashboard.transactionCount',
      color: colors.primary,
      getValue: (s) => String(s.transactionCount)
    },
    {
      id: 'avgDailySpending',
      titleKey: 'dashboard.avgDailySpending',
      color: colors.text.investment,
      getValue: (s) => fmt(s.avgDailySpending)
    },
    {
      id: 'avgWeeklySpending',
      titleKey: 'dashboard.avgWeeklySpending',
      color: colors.text.refund,
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
  const CARD_CONFIGS = createCardConfigs(currency, locale)
  const visible = CARD_CONFIGS.filter((c) => visibleCards.includes(c.id))

  return (
    <div style={styles.grid}>
      {visible.map((card) => (
        <SummaryCard
          key={card.id}
          title={t(card.titleKey)}
          value={card.getValue(stats, currency, locale)}
          color={card.color}
          isMasked={!showFinancialDetails}
        />
      ))}
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
    gap: spacing.md,
  }
}

export default SummaryCardGrid
