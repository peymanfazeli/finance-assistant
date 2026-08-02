import { useTranslation } from 'react-i18next'
import { DashboardCardId } from '../../core/models/types'
import { DashboardPeriod, DashboardPeriodKey, DASHBOARD_PERIOD_KEYS, isValidCustomRange } from '../../core/utils/dashboardPeriod'
import { colors, spacing, fontSize, fontWeight, borderRadius, padding, borderWidth } from '../../core/utils/styles'
import Modal from './Modal'
import PersianCalendar from './PersianCalendar'

interface DashboardCustomizationDialogProps {
  open: boolean
  visibleCards: DashboardCardId[]
  period: DashboardPeriod
  onPeriodChange: (period: DashboardPeriod) => void
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

const PERIOD_LABEL_KEYS: Record<DashboardPeriodKey, string> = {
  all: 'dashboard.period.all',
  today: 'dashboard.period.today',
  thisWeek: 'dashboard.period.thisWeek',
  thisMonth: 'dashboard.period.thisMonth',
  lastMonth: 'dashboard.period.lastMonth',
  thisQuarter: 'dashboard.period.thisQuarter',
  thisYear: 'dashboard.period.thisYear',
  custom: 'dashboard.period.custom'
}

function DashboardCustomizationDialog({
  open,
  visibleCards,
  period,
  onPeriodChange,
  onToggle,
  onClose
}: DashboardCustomizationDialogProps): JSX.Element | null {
  const { t } = useTranslation()
  const customInvalid = period.preset === 'custom' && !isValidCustomRange(period)

  const selectPreset = (key: DashboardPeriodKey): void => {
    if (key === 'custom') {
      onPeriodChange({ preset: 'custom', customFrom: period.customFrom, customTo: period.customTo })
    } else {
      onPeriodChange({ preset: key })
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={t('dashboard.customize')}>
      <div style={styles.section}>
        <label style={styles.sectionLabel}>{t('dashboard.timePeriod')}</label>
        <div style={styles.chipRow}>
          {DASHBOARD_PERIOD_KEYS.map((key) => {
            const isActive = period.preset === key
            return (
              <button
                key={key}
                style={{
                  ...styles.chip,
                  backgroundColor: isActive ? colors.primary : colors.bg.muted,
                  color: isActive ? colors.text.inverse : colors.text.secondary,
                  borderColor: isActive ? colors.primary : colors.border.default,
                }}
                onClick={() => selectPreset(key)}
              >
                {t(PERIOD_LABEL_KEYS[key])}
              </button>
            )
          })}
        </div>
        {period.preset === 'custom' && (
          <div style={styles.customRow}>
            <PersianCalendar value={period.customFrom ?? ''} onChange={(v) => onPeriodChange({ ...period, customFrom: v })} placeholder={t('dashboard.period.from')} compact />
            <span style={styles.sep}>-</span>
            <PersianCalendar value={period.customTo ?? ''} onChange={(v) => onPeriodChange({ ...period, customTo: v })} placeholder={t('dashboard.period.to')} compact />
          </div>
        )}
        {customInvalid && (
          <span style={styles.error}>{t('dashboard.period.invalidRange')}</span>
        )}
      </div>

      <div style={styles.divider} />

      <p style={styles.description}>
        {t('dashboard.cardsDescription')}
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
          {t('common.done')}
        </button>
      </div>
    </Modal>
  )
}

const styles: Record<string, React.CSSProperties> = {
  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  sectionLabel: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    color: colors.text.muted,
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  chipRow: {
    display: 'flex',
    gap: spacing.xs,
    flexWrap: 'wrap',
  },
  chip: {
    padding: `${spacing.xs} ${spacing.md}`,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    border: `${borderWidth.default} solid`,
    borderRadius: borderRadius.full,
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },
  customRow: {
    display: 'flex',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  sep: {
    color: colors.text.disabled,
  },
  error: {
    fontSize: fontSize.sm,
    color: colors.text.error,
  },
  divider: {
    borderBottom: `${borderWidth.default} solid ${colors.border.light}`,
    margin: `${spacing.lg} 0`,
  },
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
