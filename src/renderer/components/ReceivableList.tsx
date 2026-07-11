import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { Receivable, Transaction, Category } from '../../core/models/types'
import { ReceivableService } from '../../core/services/ReceivableService'
import { useAppStore } from '../../core/store/useAppStore'
import { formatCurrency } from '../../core/utils/format'
import { colors, spacing, fontSize, fontWeight, borderRadius, padding, borderWidth } from '../../core/utils/styles'
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
  const currency = dataset?.currency || 'USD'
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
            <th style={styles.th}>{t('receivable.category')}</th>
            <th style={styles.th}>{t('receivable.from')}</th>
            <th style={styles.thRight}>{t('receivable.totalAmount')}</th>
            <th style={styles.thRight}>{t('receivable.received')}</th>
            <th style={styles.thRight}>{t('receivable.remaining')}</th>
            <th style={styles.th}>{t('common.actions')}</th>
          </tr>
        </thead>
        <tbody>
          {receivables.map((rec, i) => {
            const received = ReceivableService.getReceivedAmount(rec, transactions)
            const remaining = ReceivableService.getRemainingAmount(rec, transactions)
            const cat = categories.find((c) => c.id === rec.categoryId)
            const remainingPercent = rec.totalAmount > 0 ? (remaining / rec.totalAmount) * 100 : 0
            let rowBg: string | undefined
            if (remainingPercent > 70) rowBg = '#FF6B6B'
            else if (remainingPercent > 50) rowBg = '#EEB04C'
            else if (remainingPercent > 25) rowBg = '#A1F9B0'
            else if (remainingPercent > 5) rowBg = '#b8f5e2'

            return (
              <motion.tr
                key={rec.id}
                style={{ ...styles.row, cursor: 'pointer', backgroundColor: rowBg }}
                variants={prefersReduced ? undefined : rowVariants}
                custom={i}
                initial="hidden"
                animate="visible"
                onClick={() => onClick(rec.id)}
              >
                <td style={styles.td}>{rec.title}</td>
                <td style={styles.td}>
                  {cat ? `${cat.icon} ${cat.name}` : rec.categoryId}
                </td>
                <td style={styles.td}>{rec.from}</td>
                <td style={styles.tdRight}>
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
  table: { width: '100%', borderCollapse: 'collapse' },
  th: {
    padding: padding.tableCell,
    textAlign: 'left',
    fontWeight: fontWeight.semibold,
    fontSize: fontSize.sm,
    color: colors.text.muted,
    borderBottom: `${borderWidth.thick} solid ${colors.border.divider}`,
    userSelect: 'none',
  },
  thRight: {
    padding: padding.tableCell,
    textAlign: 'right',
    fontWeight: fontWeight.semibold,
    fontSize: fontSize.sm,
    color: colors.text.muted,
    borderBottom: `${borderWidth.thick} solid ${colors.border.divider}`,
    userSelect: 'none',
  },
  td: { padding: padding.tableCell, fontSize: fontSize.base, borderBottom: `${borderWidth.default} solid ${colors.border.light}` },
  tdRight: { padding: padding.tableCell, fontSize: fontSize.base, borderBottom: `${borderWidth.default} solid ${colors.border.light}`, textAlign: 'right' },
  row: { transition: 'background 0.15s' },
  actionBtn: {
    padding: '4px 8px',
    marginRight: spacing.xs,
    fontSize: fontSize.sm,
    border: `${borderWidth.default} solid ${colors.border.strong}`,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.bg.card,
    cursor: 'pointer',
  },
  empty: { padding: spacing.huge, textAlign: 'center', color: colors.text.disabled, fontSize: fontSize.base },
}

export default ReceivableList
