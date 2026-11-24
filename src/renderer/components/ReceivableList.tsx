import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { Receivable, Transaction, Category } from '../../core/models/types'
import { ReceivableService } from '../../core/services/ReceivableService'
import { useAppStore } from '../../core/store/useAppStore'
import { formatCurrency } from '../../core/utils/format'
import { colors, spacing, fontSize, fontWeight, borderRadius, borderWidth } from '../../core/utils/styles'
import { uiStyles } from '../uiStyles'
import { addToast } from './ToastContainer'
import useReducedMotion from '../hooks/useReducedMotion'

interface ReceivableListProps {
  receivables: Receivable[]
  transactions: Transaction[]
  categories: Category[]
  onEdit: (id: string) => void
  onClick: (id: string) => void
}

const rowVariants = {
  hidden: { opacity: 0, y: 8 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.03, duration: 0.2, ease: 'easeOut' },
  }),
}

const listVariants = {
  visible: { transition: { staggerChildren: 0.03 } },
}

function ReceivableList({ receivables, transactions, categories, onEdit, onClick }: ReceivableListProps): JSX.Element {
  const { t, i18n } = useTranslation()
  const { deleteReceivable, dataset } = useAppStore()
  const locale = i18n.language === 'fa' ? 'fa-IR' : 'en-US'
  const currency = dataset?.currency || 'toman'
  const prefersReduced = useReducedMotion()

  if (receivables.length === 0) {
    return <div style={styles.empty}>{t('receivable.noReceivables')}</div>
  }

  return (
    <motion.div
      style={styles.container}
      variants={prefersReduced ? undefined : listVariants}
      initial="hidden"
      animate="visible"
    >
      <table style={styles.table}>
        <thead>
          <tr>
            <th style={styles.th}>{t('receivable.titleLabel')}</th>
            <th style={styles.th}>{t('receivable.askDate')}</th>
            <th style={styles.th}>{t('receivable.category')}</th>
            <th style={styles.th}>{t('receivable.from')}</th>
            <th style={styles.thRight}>{t('receivable.totalAmount')}</th>
            <th style={styles.thRight}>{t('receivable.received')}</th>
            <th style={styles.thRight}>{t('receivable.remaining')}</th>
            <th style={styles.th}>{t('receivable.payDate')}</th>
            <th style={styles.th}>{t('common.actions')}</th>
          </tr>
        </thead>
        <tbody>
          {receivables.map((rec, i) => {
            const received = ReceivableService.getReceivedAmount(rec, transactions)
            const remaining = ReceivableService.getRemainingAmount(rec, transactions)
            const payDate = ReceivableService.getPayDate(rec, transactions)
            const isFullyReceived = remaining <= 0
            const cat = categories.find((c) => c.id === rec.categoryId)
            const remainingPercent = rec.totalAmount > 0 ? (remaining / rec.totalAmount) * 100 : 0
            const progressPercent = Math.max(0, Math.min(100, 100 - remainingPercent))

            return (
              <motion.tr
                key={rec.id}
                style={{ ...styles.row, cursor: 'pointer' }}
                variants={prefersReduced ? undefined : rowVariants}
                custom={i}
                initial="hidden"
                animate="visible"
                onClick={() => onClick(rec.id)}
              >
                <td style={styles.td}>
                  <div style={styles.titleCell}>
                    <span style={{ textDecoration: isFullyReceived ? 'line-through' : undefined }}>{rec.title}</span>
                    <span style={isFullyReceived ? styles.badgePaid : styles.badgePending}>
                      {t(isFullyReceived ? 'installment.statePaid' : 'installment.statePending')}
                    </span>
                  </div>
                  <div style={styles.progressTrack}>
                    <div style={{ ...styles.progressFill, width: `${progressPercent}%` }} />
                  </div>
                </td>
                <td style={styles.td}>{rec.askDate || t('common.noData')}</td>
                <td style={styles.td}>
                  {cat ? `${cat.icon} ${cat.name}` : rec.categoryId}
                </td>
                <td style={styles.td}>{rec.from}</td>
                <td style={{ ...styles.tdRight, textDecoration: isFullyReceived ? 'line-through' : undefined }}>
                  {formatCurrency(rec.totalAmount, currency, locale)}
                </td>
                <td style={styles.tdRight}>
                  <span style={{ color: colors.text.income }}>
                    {formatCurrency(received, currency, locale)}
                  </span>
                </td>
                <td style={styles.tdRight}>
                  <span style={{ color: remaining > 0 ? colors.text.income : colors.text.expense, fontWeight: fontWeight.semibold }}>
                    {formatCurrency(remaining, currency, locale)}
                  </span>
                </td>
                <td style={styles.td}>{payDate || t('common.noData')}</td>
                <td style={styles.td}>
                  <motion.button
                    style={styles.actionBtn}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={(e) => { e.stopPropagation(); onEdit(rec.id) }}
                  >
                    {t('common.edit')}
                  </motion.button>
                  <motion.button
                    style={{ ...styles.actionBtn, color: colors.danger }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={(e) => {
                      e.stopPropagation()
                      if (confirm(t('receivable.confirmDelete'))) {
                        deleteReceivable(rec.id)
                        addToast('success', t('receivable.deleted'))
                      }
                    }}
                  >
                    {t('common.delete')}
                  </motion.button>
                </td>
              </motion.tr>
            )
          })}
        </tbody>
      </table>
    </motion.div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  container: { overflowX: 'auto' },
  table: uiStyles.table,
  th: { ...uiStyles.th, userSelect: 'none' },
  thRight: { ...uiStyles.thRight, userSelect: 'none' },
  td: uiStyles.td,
  tdRight: uiStyles.tdRight,
  row: { transition: 'background-color 0.15s' },
  titleCell: {
    display: 'flex',
    alignItems: 'center',
    gap: spacing.sm,
    flexWrap: 'wrap',
    minWidth: '160px',
  },
  progressTrack: {
    height: '4px',
    marginTop: spacing.sm,
    backgroundColor: colors.bg.subtle,
    borderRadius: borderRadius.full,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: borderRadius.full,
    transition: 'width 0.2s ease',
  },
  badgePaid: {
    ...uiStyles.badge,
    color: colors.text.income,
    backgroundColor: colors.bg.income,
  },
  badgePending: {
    ...uiStyles.badge,
    color: colors.text.warning,
    backgroundColor: colors.bg.warning,
  },
  actionBtn: {
    padding: `${spacing.xs} ${spacing.sm}`,
    marginInlineEnd: spacing.xs,
    fontSize: fontSize.sm,
    color: colors.text.secondary,
    border: `${borderWidth.default} solid ${colors.border.default}`,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.bg.subtle,
    cursor: 'pointer',
  },
  empty: { padding: spacing.xxl, textAlign: 'center', color: colors.text.muted, fontSize: fontSize.base },
}

export default ReceivableList
