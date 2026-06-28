import { DashboardStats, DashboardCardId } from '../../core/models/types'
import SummaryCard from './SummaryCard'
import { formatCurrency } from '../../core/utils/format'

interface SummaryCardConfig {
  id: DashboardCardId
  title: string
  icon: string
  color: string
  getValue: (stats: DashboardStats, currency: string, locale: string) => string
}

function createCardConfigs(currency: string, locale: string): SummaryCardConfig[] {
  const fmt = (amount: number): string => formatCurrency(amount, currency, locale)
  return [
    {
      id: 'totalIncome',
      title: 'Total Income',
      icon: '💰',
      color: '#155724',
      getValue: (s) => fmt(s.totalIncome)
    },
    {
      id: 'totalExpenses',
      title: 'Total Expenses',
      icon: '💸',
      color: '#721c24',
      getValue: (s) => fmt(-s.totalExpenses)
    },
    {
      id: 'netBalance',
      title: 'Net Balance',
      icon: '📊',
      color: '#856404',
      getValue: (s) => fmt(s.netBalance)
    },
    {
      id: 'transactionCount',
      title: 'Transactions',
      icon: '📝',
      color: '#4A90D9',
      getValue: () => ''
    },
    {
      id: 'avgDailySpending',
      title: 'Avg Daily Spending',
      icon: '📅',
      color: '#6c757d',
      getValue: (s) => fmt(s.avgDailySpending)
    },
    {
      id: 'avgWeeklySpending',
      title: 'Avg Weekly Spending',
      icon: '📆',
      color: '#6c757d',
      getValue: (s) => fmt(s.avgWeeklySpending)
    }
  ]
}

interface SummaryCardGridProps {
  stats: DashboardStats
  visibleCards: DashboardCardId[]
  currency?: string
  locale?: string
}

function SummaryCardGrid({ stats, visibleCards, currency = 'USD', locale = 'en-US' }: SummaryCardGridProps): JSX.Element {
  const CARD_CONFIGS = createCardConfigs(currency, locale)
  const visible = CARD_CONFIGS.filter((c) => visibleCards.includes(c.id))

  return (
    <div style={styles.grid}>
      {visible.map((card) => (
        <SummaryCard
          key={card.id}
          title={card.title}
          value={card.id === 'transactionCount' ? String(stats.transactionCount) : card.getValue(stats, currency, locale)}
          icon={card.icon}
          color={card.color}
        />
      ))}
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
    gap: '16px',
    padding: '16px 0'
  }
}

export default SummaryCardGrid
