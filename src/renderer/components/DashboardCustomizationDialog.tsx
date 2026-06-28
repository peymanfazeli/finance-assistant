import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import { DashboardCardId } from '../../core/models/types'
import { colors, spacing, fontSize, fontWeight, borderRadius, padding, borderWidth } from '../../core/utils/styles'
import Modal from './Modal'

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

  return (
    <Modal open={open} onClose={onClose} title={t('dashboard.customize')}>
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
        <motion.button
          style={styles.closeBtn}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={onClose}
        >
          {t('common.close')}
        </motion.button>
      </div>
    </Modal>
  )
}

const styles: Record<string, React.CSSProperties> = {
  item: { display: 'flex', alignItems: 'center', gap: spacing.sm, padding: `${spacing.sm} 0`, fontSize: fontSize.base, cursor: 'pointer' },
  buttons: { marginTop: spacing.lg, display: 'flex', justifyContent: 'flex-end' },
  closeBtn: { padding: padding.button, fontSize: fontSize.md, color: colors.text.inverse, backgroundColor: colors.primary, border: 'none', borderRadius: borderRadius.md, cursor: 'pointer' },
}

export default DashboardCustomizationDialog
