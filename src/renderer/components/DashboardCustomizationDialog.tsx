import { useTranslation } from 'react-i18next'
import { DashboardCardId } from '../../core/models/types'
import { colors, spacing, fontSize, fontWeight, borderRadius, padding, borderWidth } from '../../core/utils/styles'
import Modal from './Modal'

interface DashboardCustomizationDialogProps {
  open: boolean
  visibleCards: DashboardCardId[]
  onToggle: (cardId: DashboardCardId) => void
  onClose: () => void
}

const ALL_CARDS: { id: DashboardCardId; labelKey: string }[] = [
  { id: 'totalIncome', labelKey: 'dashboard.totalIncome' },
  { id: 'totalExpenses', labelKey: 'dashboard.totalExpenses' },
  { id: 'netBalance', labelKey: 'dashboard.netBalance' },
  { id: 'transactionCount', labelKey: 'dashboard.transactionCount' },
  { id: 'avgDailySpending', labelKey: 'dashboard.avgDailySpending' },
  { id: 'avgWeeklySpending', labelKey: 'dashboard.avgWeeklySpending' }
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
      <p style={styles.description}>
        Choose which cards to display on your dashboard.
      </p>
      <div style={styles.list}>
        {ALL_CARDS.map((card) => (
          <label key={card.id} style={styles.item}>
            <div style={styles.itemLeft}>
              <span style={styles.cardName}>{t(card.labelKey)}</span>
            </div>
            <div
              style={{
                ...styles.toggle,
                ...(visibleCards.includes(card.id) ? styles.toggleOn : {}),
              }}
              onClick={() => onToggle(card.id)}
            >
              <div style={{
                ...styles.toggleThumb,
                ...(visibleCards.includes(card.id) ? styles.toggleThumbOn : {}),
              }} />
            </div>
          </label>
        ))}
      </div>
      <div style={styles.footer}>
        <button style={styles.closeBtn} onClick={onClose}>
          {t('common.close')}
        </button>
      </div>
    </Modal>
  )
}

const styles: Record<string, React.CSSProperties> = {
  description: {
    fontSize: fontSize.sm,
    color: colors.text.subtle,
    margin: `0 0 ${spacing.lg}`,
    lineHeight: '1.5',
  },
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.sm,
  },
  item: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: `${spacing.sm} ${spacing.md}`,
    backgroundColor: colors.bg.muted,
    borderRadius: borderRadius.md,
    cursor: 'pointer',
    transition: 'background-color 0.15s ease',
  },
  itemLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: spacing.sm,
  },
  cardName: {
    fontSize: fontSize.sm,
    color: colors.text.primary,
  },
  toggle: {
    position: 'relative',
    width: '36px',
    height: '20px',
    backgroundColor: colors.border.default,
    borderRadius: '10px',
    cursor: 'pointer',
    transition: 'background-color 0.15s ease',
  },
  toggleOn: {
    backgroundColor: colors.primary,
  },
  toggleThumb: {
    position: 'absolute',
    left: '2px',
    top: '2px',
    width: '16px',
    height: '16px',
    backgroundColor: colors.bg.card,
    borderRadius: borderRadius.full,
    transition: 'transform 0.15s ease',
    boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
  },
  toggleThumbOn: {
    transform: 'translateX(16px)',
  },
  footer: {
    marginTop: spacing.xl,
    display: 'flex',
    justifyContent: 'flex-end',
  },
  closeBtn: {
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
}

export default DashboardCustomizationDialog
