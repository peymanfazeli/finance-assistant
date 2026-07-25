import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { Transaction, TransactionType, SortConfig, Category } from '../../core/models/types'
import { useAppStore } from '../../core/store/useAppStore'
import { formatCurrency } from '../../core/utils/format'
import { formatJalaliDate } from '../../core/utils/jalali'
import { colors, spacing, fontSize, fontWeight, borderRadius, padding, borderWidth } from '../../core/utils/styles'
import { addToast } from './ToastContainer'
import useReducedMotion from '../hooks/useReducedMotion'

interface TransactionListProps {
  transactions: Transaction[]
  categories: Category[]
  onEdit: (id: string) => void
}

const rowVariants = {
  hidden: { opacity: 0, y: 4 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.02, duration: 0.15, ease: 'easeOut' },
  }),
}

const listVariants = {
  visible: { transition: { staggerChildren: 0.02 } },
}

function TransactionList({ transactions, categories, onEdit }: TransactionListProps): JSX.Element {
  const { t, i18n } = useTranslation()
  const { sortConfig, setSortConfig, deleteTransaction, duplicateTransaction, dataset } = useAppStore()
  const locale = i18n.language === 'fa' ? 'fa-IR' : 'en-US'
  const currency = dataset?.currency || 'toman'
  const prefersReduced = useReducedMotion()
  const usePersianDigits = i18n.language === 'fa'

  const handleSort = (field: SortConfig['field']): void => {
    setSortConfig({
      field,
      direction:
        sortConfig.field === field && sortConfig.direction === 'asc' ? 'desc' : 'asc'
    })
  }

  const sortIndicator = (field: SortConfig['field']): string => {
    if (sortConfig.field !== field) return ''
    return sortConfig.direction === 'asc' ? ' ↑' : ' ↓'
  }

  if (transactions.length === 0) {
    return (
      <div style={styles.empty}>
        <div style={styles.emptyIcon}>📋</div>
        <p style={styles.emptyText}>{t('transaction.noTransactions')}</p>
      </div>
    )
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
              {t('transaction.date')}{sortIndicator('date')}
            </th>
            <th style={styles.th} onClick={() => handleSort('title')}>
              {t('transaction.titleLabel')}{sortIndicator('title')}
            </th>
            <th style={styles.th} onClick={() => handleSort('categoryId')}>
              {t('transaction.category')}{sortIndicator('categoryId')}
            </th>
            <th style={styles.th} onClick={() => handleSort('type')}>
              {t('transaction.type')}{sortIndicator('type')}
            </th>
            <th style={styles.thRight} onClick={() => handleSort('amount')}>
              {t('transaction.amount')}{sortIndicator('amount')}
            </th>
            <th style={styles.thRight}>{t('common.actions')}</th>
          </tr>
        </thead>
        <tbody>
          {transactions.map((tx, i) => (
            <motion.tr
              key={tx.id}
              style={i % 2 === 0 ? styles.rowEven : styles.rowOdd}
              variants={prefersReduced ? undefined : rowVariants}
              custom={i}
              initial="hidden"
              animate="visible"
            >
              <td style={styles.td}>{formatJalaliDate(tx.date, usePersianDigits)}</td>
              <td style={styles.td}>
                <span style={styles.titleText}>{tx.title}</span>
              </td>
              <td style={styles.td}>
                {(() => {
                  const cat = categories.find((c) => c.id === tx.categoryId)
                  return cat ? (
                    <span style={styles.categoryBadge}>
                      <span>{cat.icon}</span>
                      <span>{cat.name}</span>
                    </span>
                  ) : tx.categoryId
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
                          : tx.type === TransactionType.Investment
                            ? colors.bg.investment
                            : colors.bg.refund,
                    color:
                      tx.type === TransactionType.Income
                        ? colors.text.income
                        : tx.type === TransactionType.Expense
                          ? colors.text.expense
                          : tx.type === TransactionType.Investment
                            ? colors.text.investment
                            : colors.text.refund,
                  }}
                >
                  {t(`transaction.${tx.type}`)}
                </span>
              </td>
              <td style={styles.tdRight}>
                <span style={{
                  fontWeight: fontWeight.semibold,
                  fontVariantNumeric: 'tabular-nums',
                  color:
                    tx.type === TransactionType.Income
                      ? colors.text.income
                      : tx.type === TransactionType.Expense
                        ? colors.text.expense
                        : tx.type === TransactionType.Investment
                          ? colors.text.investment
                          : colors.text.refund,
                }}>
                  {tx.type === TransactionType.Expense || tx.type === TransactionType.Investment ? '-' : '+'}
                  {formatCurrency(tx.amount, currency, locale)}
                </span>
              </td>
              <td style={styles.tdRight}>
                <div style={styles.actions}>
                  <button
                    style={styles.actionBtn}
                    onClick={() => onEdit(tx.id)}
                  >
                    {t('common.edit')}
                  </button>
                  <button
                    style={styles.actionBtn}
                    onClick={() => { duplicateTransaction(tx.id); addToast('success', t('transaction.duplicated')) }}
                  >
                    {t('transaction.duplicate')}
                  </button>
                  <button
                    style={styles.actionBtnDanger}
                    onClick={() => {
                      if (confirm(t('transaction.confirmDelete'))) {
                        deleteTransaction(tx.id)
                        addToast('success', t('transaction.deleted'))
                      }
                    }}
                  >
                    {t('common.delete')}
                  </button>
                </div>
              </td>
            </motion.tr>
          ))}
        </tbody>
      </table>
    </motion.div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    width: '100%',
    height: '100%',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  th: {
    padding: `${spacing.sm} ${spacing.lg}`,
    textAlign: 'left',
    fontWeight: fontWeight.semibold,
    fontSize: fontSize.xs,
    color: colors.text.disabled,
    backgroundColor: colors.bg.muted,
    borderBottom: `${borderWidth.thick} solid ${colors.border.divider}`,
    cursor: 'pointer',
    userSelect: 'none',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    position: 'sticky',
    top: 0,
    zIndex: 1,
  },
  thRight: {
    padding: `${spacing.sm} ${spacing.lg}`,
    textAlign: 'right',
    fontWeight: fontWeight.semibold,
    fontSize: fontSize.xs,
    color: colors.text.disabled,
    backgroundColor: colors.bg.muted,
    borderBottom: `${borderWidth.thick} solid ${colors.border.divider}`,
    cursor: 'pointer',
    userSelect: 'none',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    position: 'sticky',
    top: 0,
    zIndex: 1,
  },
  td: {
    padding: `${spacing.sm} ${spacing.lg}`,
    fontSize: fontSize.sm,
    borderBottom: `${borderWidth.default} solid ${colors.border.light}`,
    color: colors.text.primary,
  },
  tdRight: {
    padding: `${spacing.sm} ${spacing.lg}`,
    fontSize: fontSize.sm,
    borderBottom: `${borderWidth.default} solid ${colors.border.light}`,
    textAlign: 'right',
  },
  rowEven: {
    transition: 'background-color 0.1s ease',
  },
  rowOdd: {
    backgroundColor: colors.bg.muted,
    transition: 'background-color 0.1s ease',
  },
  titleText: {
    fontWeight: fontWeight.medium,
  },
  categoryBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: spacing.xs,
  },
  typeBadge: {
    display: 'inline-block',
    padding: `${spacing.xs} ${spacing.sm}`,
    borderRadius: borderRadius.sm,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
  },
  actions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: spacing.xs,
  },
  actionBtn: {
    padding: `${spacing.xs} ${spacing.sm}`,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
    color: colors.text.muted,
    backgroundColor: 'transparent',
    border: `${borderWidth.default} solid ${colors.border.light}`,
    borderRadius: borderRadius.sm,
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },
  actionBtnDanger: {
    padding: `${spacing.xs} ${spacing.sm}`,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
    color: colors.danger,
    backgroundColor: 'transparent',
    border: `${borderWidth.default} solid ${colors.border.light}`,
    borderRadius: borderRadius.sm,
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },
  empty: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.huge,
    gap: spacing.sm,
  },
  emptyIcon: {
    fontSize: '32px',
    opacity: 0.4,
  },
  emptyText: {
    fontSize: fontSize.sm,
    color: colors.text.disabled,
    margin: 0,
  },
}

export default TransactionList
