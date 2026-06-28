import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { Transaction, TransactionType, SortConfig, Category } from '../../core/models/types'
import { useAppStore } from '../../core/store/useAppStore'
import { formatCurrency } from '../../core/utils/format'
import { colors, spacing, fontSize, fontWeight, borderRadius, padding, borderWidth } from '../../core/utils/styles'
import { addToast } from './ToastContainer'
import useReducedMotion from '../hooks/useReducedMotion'

interface TransactionListProps {
  transactions: Transaction[]
  categories: Category[]
  onEdit: (id: string) => void
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

function TransactionList({ transactions, categories, onEdit }: TransactionListProps): JSX.Element {
  const { t, i18n } = useTranslation()
  const { sortConfig, setSortConfig, deleteTransaction, duplicateTransaction, dataset } = useAppStore()
  const locale = i18n.language === 'fa' ? 'fa-IR' : 'en-US'
  const currency = dataset?.currency || 'USD'
  const prefersReduced = useReducedMotion()

  const handleSort = (field: SortConfig['field']): void => {
    setSortConfig({
      field,
      direction:
        sortConfig.field === field && sortConfig.direction === 'asc' ? 'desc' : 'asc'
    })
  }

  const sortIndicator = (field: SortConfig['field']): string => {
    if (sortConfig.field !== field) return '↕'
    return sortConfig.direction === 'asc' ? '↑' : '↓'
  }

  if (transactions.length === 0) {
    return <div style={styles.empty}>{t('transaction.noTransactions')}</div>
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
            <th style={styles.th} onClick={() => handleSort('date')}>
              {t('transaction.date')} {sortIndicator('date')}
            </th>
            <th style={styles.th} onClick={() => handleSort('title')}>
              {t('transaction.titleLabel')} {sortIndicator('title')}
            </th>
            <th style={styles.th} onClick={() => handleSort('categoryId')}>
              {t('transaction.category')} {sortIndicator('categoryId')}
            </th>
            <th style={styles.th} onClick={() => handleSort('type')}>
              {t('transaction.type')} {sortIndicator('type')}
            </th>
            <th style={styles.thRight} onClick={() => handleSort('amount')}>
              {t('transaction.amount')} {sortIndicator('amount')}
            </th>
            <th style={styles.th}>{t('common.actions')}</th>
          </tr>
        </thead>
        <tbody>
          {transactions.map((tx, i) => (
            <motion.tr
              key={tx.id}
              style={styles.row}
              variants={prefersReduced ? undefined : rowVariants}
              custom={i}
              initial="hidden"
              animate="visible"
            >
              <td style={styles.td}>{tx.date}</td>
              <td style={styles.td}>{tx.title}</td>
              <td style={styles.td}>
                {(() => {
                  const cat = categories.find((c) => c.id === tx.categoryId)
                  return cat ? `${cat.icon} ${cat.name}` : tx.categoryId
                })()}
              </td>
              <td style={styles.td}>
                <span
                  style={{
                    ...styles.typeBadge,
                    backgroundColor:
                      tx.type === TransactionType.Income
                        ? colors.bg.income
                        : tx.type === TransactionType.Expense
                          ? colors.bg.expense
                          : colors.bg.refund,
                  }}
                >
                  {t(`transaction.${tx.type}`)}
                </span>
              </td>
              <td style={styles.tdRight}>
                <span
                  style={{
                    color:
                      tx.type === TransactionType.Income
                        ? colors.text.income
                        : tx.type === TransactionType.Expense
                          ? colors.text.expense
                          : colors.text.refund,
                  }}
                >
                  {formatCurrency(
                    tx.type === TransactionType.Expense ? -tx.amount : tx.amount,
                    currency,
                    locale
                  )}
                </span>
              </td>
              <td style={styles.td}>
                <motion.button
                  style={styles.actionBtn}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => onEdit(tx.id)}
                >
                  {t('common.edit')}
                </motion.button>
                <motion.button
                  style={styles.actionBtn}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => { duplicateTransaction(tx.id); addToast('success', t('transaction.duplicated')) }}
                >
                  {t('transaction.duplicate')}
                </motion.button>
                <motion.button
                  style={{ ...styles.actionBtn, color: colors.danger }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    if (confirm(t('transaction.confirmDelete'))) {
                      deleteTransaction(tx.id)
                      addToast('success', t('transaction.deleted'))
                    }
                  }}
                >
                  {t('common.delete')}
                </motion.button>
              </td>
            </motion.tr>
          ))}
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
    cursor: 'pointer',
    userSelect: 'none',
  },
  thRight: {
    padding: padding.tableCell,
    textAlign: 'right',
    fontWeight: fontWeight.semibold,
    fontSize: fontSize.sm,
    color: colors.text.muted,
    borderBottom: `${borderWidth.thick} solid ${colors.border.divider}`,
    cursor: 'pointer',
    userSelect: 'none',
  },
  td: { padding: padding.tableCell, fontSize: fontSize.base, borderBottom: `${borderWidth.default} solid ${colors.border.light}` },
  tdRight: { padding: padding.tableCell, fontSize: fontSize.base, borderBottom: `${borderWidth.default} solid ${colors.border.light}`, textAlign: 'right' },
  row: { transition: 'background 0.15s' },
  typeBadge: {
    display: 'inline-block',
    padding: padding.badge,
    borderRadius: borderRadius.sm,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
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

export default TransactionList
