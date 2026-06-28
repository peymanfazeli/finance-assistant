import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAppStore } from '../../core/store/useAppStore'
import { DashboardCardId } from '../../core/models/types'
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
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>{t('dashboard.title')}</h2>
        <button style={styles.customizeBtn} onClick={() => setShowCustomize(true)}>
          {t('dashboard.customize')}
        </button>
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
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  container: { padding: '24px' },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px'
  },
  title: { fontSize: '20px', fontWeight: 600, margin: 0, color: '#1a1a1a' },
  customizeBtn: {
    padding: '8px 14px',
    fontSize: '13px',
    color: '#4A90D9',
    backgroundColor: '#fff',
    border: '1px solid #4A90D9',
    borderRadius: '6px',
    cursor: 'pointer'
  },
  empty: {
    padding: '64px 24px',
    textAlign: 'center',
    color: '#888',
    fontSize: '14px'
  }
}

export default DashboardPage
