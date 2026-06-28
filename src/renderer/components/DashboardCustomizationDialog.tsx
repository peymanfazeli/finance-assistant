import { useTranslation } from 'react-i18next'
import { DashboardCardId } from '../../core/models/types'

interface DashboardCustomizationDialogProps {
  open: boolean
  visibleCards: DashboardCardId[]
  onToggle: (cardId: DashboardCardId) => void
  onClose: () => void
}

const ALL_CARDS: { id: DashboardCardId; label: string }[] = [
  { id: 'totalIncome', label: 'Total Income' },
  { id: 'totalExpenses', label: 'Total Expenses' },
  { id: 'netBalance', label: 'Net Balance' },
  { id: 'transactionCount', label: 'Transactions' },
  { id: 'avgDailySpending', label: 'Avg Daily Spending' },
  { id: 'avgWeeklySpending', label: 'Avg Weekly Spending' }
]

function DashboardCustomizationDialog({
  open,
  visibleCards,
  onToggle,
  onClose
}: DashboardCustomizationDialogProps): JSX.Element | null {
  const { t } = useTranslation()

  if (!open) return null

  return (
    <div style={styles.overlay}>
      <div style={styles.dialog}>
        <h3 style={styles.title}>{t('dashboard.customize')}</h3>
        {ALL_CARDS.map((card) => (
          <label key={card.id} style={styles.item}>
            <input
              type="checkbox"
              checked={visibleCards.includes(card.id)}
              onChange={() => onToggle(card.id)}
            />
            {card.label}
          </label>
        ))}
        <div style={styles.buttons}>
          <button style={styles.closeBtn} onClick={onClose}>{t('common.close')}</button>
        </div>
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000
  },
  dialog: {
    backgroundColor: '#fff',
    borderRadius: '12px',
    padding: '24px',
    width: '320px',
    boxShadow: '0 4px 24px rgba(0,0,0,0.15)'
  },
  title: { fontSize: '18px', fontWeight: 600, margin: '0 0 16px', color: '#1a1a1a' },
  item: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 0',
    fontSize: '14px',
    cursor: 'pointer'
  },
  buttons: { marginTop: '16px', display: 'flex', justifyContent: 'flex-end' },
  closeBtn: {
    padding: '8px 16px',
    fontSize: '13px',
    color: '#fff',
    backgroundColor: '#4A90D9',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer'
  }
}

export default DashboardCustomizationDialog
