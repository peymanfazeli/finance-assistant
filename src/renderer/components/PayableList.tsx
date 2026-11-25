import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { Payable, Transaction, Category } from '../../core/models/types'
import { PayableService } from '../../core/services/PayableService'
import { useAppStore } from '../../core/store/useAppStore'
import { formatCurrency } from '../../core/utils/format'
import { colors, spacing, fontSize, fontWeight, borderRadius, borderWidth } from '../../core/utils/styles'
import { uiStyles } from '../uiStyles'
import { addToast } from './ToastContainer'
import useReducedMotion from '../hooks/useReducedMotion'

interface PayableListProps {
  payables: Payable[]
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

function PayableList({ payables, transactions, categories, onEdit, onClick }: PayableListProps): JSX.Element {
  const { t, i18n } = useTranslation()
  const { deletePayable, dataset } = useAppStore()
  const locale = i18n.language === 'fa' ? 'fa-IR' : 'en-US'
  const currency = dataset?.currency || 'toman'
  const prefersReduced = useReducedMotion()

  if (payables.length === 0) {
    return <div style={styles.empty}>{t('payable.noPayables')}</div>
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
            <th style={styles.th}>{t('payable.titleLabel')}</th>
            <th style={styles.th}>{t('payable.dueDate')}</th>
            <th style={styles.th}>{t('payable.category')}</th>
            <th style={styles.th}>{t('payable.to')}</th>
            <th style={styles.thRight}>{t('payable.totalAmount')}</th>
            <th style={styles.thRight}>{t('payable.paid')}</th>
            <th style={styles.thRight}>{t('payable.remaining')}</th>
            <th style={styles.th}>{t('payable.paidDate')}</th>
            <th style={styles.th}>{t('common.actions')}</th>
          </tr>
        </thead>
        <tbody>
          {payables.map((pay, i) => {
            const paid = PayableService.getPaidAmount(pay, transactions, payables)
            const remaining = PayableService.getRemainingAmount(pay, transactions, payables)
            const paidDate = PayableService.getPaidDate(pay, transactions, payables)
            const isFullyPaid = remaining <= 0
            const cat = categories.find((c) => c.id === pay.categoryId)
            const remainingPercent = pay.totalAmount > 0 ? (remaining / pay.totalAmount) * 100 : 0
            const progressPercent = Math.max(0, Math.min(100, 100 - remainingPercent))

            return (
              <motion.tr
                key={pay.id}
                style={{ ...styles.row, cursor: 'pointer' }}
                variants={prefersReduced ? undefined : rowVariants}
                custom={i}
                initial="hidden"
                animate="visible"
                onClick={() => onClick(pay.id)}
              >
                <td style={styles.td}>
                  <div style={styles.titleCell}>
                    <span style={{ textDecoration: isFullyPaid ? 'line-through' : undefined }}>{pay.title}</span>
                    <span style={isFullyPaid ? styles.badgePaid : styles.badgePending}>
                      {t(isFullyPaid ? 'installment.statePaid' : 'installment.statePending')}
                    </span>
                  </div>
                  <div style={styles.progressTrack}>
                    <div style={{ ...styles.progressFill, width: `${progressPercent}%` }} />
                  </div>
                </td>
                <td style={styles.td}>{(pay as any).dueDate || t('common.noData')}</td>
                <td style={styles.td}>
                  {cat ? `${cat.icon} ${cat.name}` : pay.categoryId}
                </td>
                <td style={styles.td}>{(pay as any).to}</td>
                <td style={{ ...styles.tdRight, textDecoration: isFullyPaid ? 'line-through' : undefined }}>
                  {formatCurrency(pay.totalAmount, currency, locale)}
                </td>
                <td style={styles.tdRight}>
                  <span style={{ color: colors.text.expense }}>
                    {formatCurrency(paid, currency, locale)}
                  </span>
                </td>
                <td style={styles.tdRight}>
                  <span style={{ color: remaining > 0 ? colors.text.expense : colors.text.income, fontWeight: fontWeight.semibold }}>
                    {formatCurrency(remaining, currency, locale)}
                  </span>
                </td>
                <td style={styles.td}>{paidDate || t('common.noData')}</td>
                <td style={styles.td}>
                  <motion.button
                    style={styles.actionBtn}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={(e) => { e.stopPropagation(); onEdit(pay.id) }}
                  >
                    {t('common.edit')}
                  </motion.button>
                  <motion.button
                    style={{ ...styles.actionBtn, color: colors.danger }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={(e) => {
                      e.stopPropagation()
                      if (confirm(t('payable.confirmDelete'))) {
                        try {
                          deletePayable(pay.id)
                          addToast('success', t('payable.deleted'))
                        } catch {
                          addToast('error', t('payable.deleteHasPayments'))
                        }
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

export default PayableList
