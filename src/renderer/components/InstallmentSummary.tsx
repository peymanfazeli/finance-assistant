import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { InstallmentStatus, Payable } from '../../core/models/types'
import {
  InstallmentFilter,
  InstallmentRow,
  PayableInstallmentService
} from '../../core/services/PayableInstallmentService'
import { formatCurrency } from '../../core/utils/format'
import { formatJalaliDate } from '../../core/utils/jalali'
import {
  colors,
  spacing,
  padding,
  fontSize,
  fontWeight,
  borderRadius,
  borderWidth,
  sizes,
  zIndex
} from '../../core/utils/styles'
import PersianCalendar from './PersianCalendar'
import Modal from './Modal'

interface InstallmentSummaryProps {
  payables: Payable[]
  currency: string
  onUpdateInstallment: (
    payableId: string,
    installmentId: string,
    updates: { amount?: number; dueDate?: string }
  ) => void
  onSetInstallmentPaid: (payableId: string, installmentId: string, paid: boolean) => void
  onViewPayable: (payableId: string) => void
}

const FILTERS: InstallmentFilter[] = ['all', 'pending', 'paid', 'overdue']

function InstallmentSummary({
  payables,
  currency,
  onUpdateInstallment,
  onSetInstallmentPaid,
  onViewPayable
}: InstallmentSummaryProps): JSX.Element {
  const { t, i18n } = useTranslation()
  const locale = i18n.language === 'fa' ? 'fa-IR' : 'en-US'
  const usePersianDigits = i18n.language === 'fa'
  const [filter, setFilter] = useState<InstallmentFilter>('all')
  const [editing, setEditing] = useState<InstallmentRow | null>(null)
  const [editAmount, setEditAmount] = useState('')
  const [editDate, setEditDate] = useState('')

  const summary = useMemo(() => PayableInstallmentService.getSummary(payables), [payables])
  const rows = useMemo(() => PayableInstallmentService.filterRows(summary.rows, filter), [summary.rows, filter])
  const overdueAmount = summary.rows
    .filter((row) => row.state === 'overdue')
    .reduce((sum, row) => sum + row.installment.amount, 0)

  const openEditor = (row: InstallmentRow): void => {
    setEditing(row)
    setEditAmount(String(row.installment.amount))
    setEditDate(row.installment.dueDate)
  }

  const saveEditor = (): void => {
    if (!editing) return
    const amount = Number(editAmount)
    if (!Number.isFinite(amount) || amount <= 0 || !editDate) return
    onUpdateInstallment(editing.payableId, editing.installment.id, { amount, dueDate: editDate })
    setEditing(null)
  }

  const stateLabel = (state: InstallmentRow['state']): string =>
    t(state === 'paid' ? 'installment.statePaid' : state === 'overdue' ? 'installment.stateOverdue' : 'installment.statePending')

  const stateStyle = (state: InstallmentRow['state']): React.CSSProperties => ({
    ...styles.badge,
    backgroundColor:
      state === 'paid' ? colors.bg.income : state === 'overdue' ? colors.bg.expense : colors.bg.warning,
    color:
      state === 'paid' ? colors.text.income : state === 'overdue' ? colors.text.expense : colors.text.warning
  })

  return (
    <section style={styles.section}>
      <h3 style={styles.title}>{t('installment.summaryTitle')}</h3>

      <div style={styles.cards}>
        <motion.div style={styles.card} whileHover={{ y: -2 }}>
          <span style={styles.cardLabel}>{t('installment.dueThisMonth')}</span>
          <span style={{ ...styles.cardValue, color: colors.text.expense }}>
            {formatCurrency(summary.dueThisMonth, currency, locale)}
          </span>
        </motion.div>
        <motion.div style={styles.card} whileHover={{ y: -2 }}>
          <span style={styles.cardLabel}>{t('installment.stateOverdue')}</span>
          <span style={{ ...styles.cardValue, color: colors.text.expense }}>
            {formatCurrency(overdueAmount, currency, locale)}
          </span>
        </motion.div>
      </div>

      <div style={styles.filters}>
        {FILTERS.map((item) => (
          <button
            key={item}
            type="button"
            style={filter === item ? styles.filterActive : styles.filterButton}
            onClick={() => setFilter(item)}
          >
            {t(`installment.filter${item.charAt(0).toUpperCase()}${item.slice(1)}`)}
          </button>
        ))}
      </div>

      {rows.length === 0 ? (
        <div style={styles.empty}>{t('installment.empty')}</div>
      ) : (
        <div style={styles.tableWrapper}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>{t('installment.payable')}</th>
                <th style={styles.th}>{t('installment.number')}</th>
                <th style={styles.th}>{t('installment.dueDate')}</th>
                <th style={styles.thRight}>{t('installment.amount')}</th>
                <th style={styles.th}>{t('installment.status')}</th>
                <th style={styles.th}>{t('installment.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.installment.id}>
                  <td style={styles.td}>
                    <button type="button" style={styles.linkButton} onClick={() => onViewPayable(row.payableId)}>
                      {row.payableTitle}
                    </button>
                  </td>
                  <td style={styles.td}>{row.number} / {row.count}</td>
                  <td style={styles.td}>{formatJalaliDate(row.installment.dueDate, usePersianDigits)}</td>
                  <td style={styles.tdRight}>{formatCurrency(row.installment.amount, currency, locale)}</td>
                  <td style={styles.td}><span style={stateStyle(row.state)}>{stateLabel(row.state)}</span></td>
                  <td style={styles.td}>
                    <div style={styles.actions}>
                      <button type="button" style={styles.smallButton} onClick={() => openEditor(row)}>
                        {t('installment.edit')}
                      </button>
                      <button
                        type="button"
                        style={row.installment.status === InstallmentStatus.Paid ? styles.smallButton : styles.primarySmallButton}
                        onClick={() => onSetInstallmentPaid(
                          row.payableId,
                          row.installment.id,
                          row.installment.status !== InstallmentStatus.Paid
                        )}
                      >
                        {t(row.installment.status === InstallmentStatus.Paid ? 'installment.markUnpaid' : 'installment.markPaid')}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal
        open={editing !== null}
        onClose={() => setEditing(null)}
        title={t('installment.editTitle')}
        width="400px"
      >
        {editing && (
          <div>
            <div style={styles.editField}>
              <label style={styles.editLabel}>{t('installment.amount')}</label>
              <input
                aria-label={t('installment.amount')}
                style={styles.editInput}
                type="number"
                min="0"
                step="0.01"
                value={editAmount}
                onChange={(event) => setEditAmount(event.target.value)}
              />
            </div>
            <div style={styles.editField}>
              <label style={styles.editLabel}>{t('installment.dueDate')}</label>
              <PersianCalendar value={editDate} onChange={setEditDate} compact />
            </div>
            <div style={styles.editActions}>
              <button type="button" style={styles.cancelButton} onClick={() => setEditing(null)}>
                {t('common.cancel')}
              </button>
              <button type="button" style={styles.primarySmallButton} onClick={saveEditor}>
                {t('installment.save')}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </section>
  )
}

const styles: Record<string, React.CSSProperties> = {
  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.md,
    minWidth: 0,
  },
  title: {
    margin: 0,
    fontSize: fontSize.xl,
    fontWeight: fontWeight.semibold,
    color: colors.text.primary
  },
  filters: { display: 'flex', gap: spacing.xs, flexWrap: 'wrap' },
  filterButton: {
    padding: padding.chip,
    fontSize: fontSize.sm,
    color: colors.text.muted,
    backgroundColor: colors.bg.muted,
    border: `${borderWidth.default} solid ${colors.border.default}`,
    borderRadius: borderRadius.full,
    cursor: 'pointer'
  },
  filterActive: {
    padding: padding.chip,
    fontSize: fontSize.sm,
    color: colors.text.inverse,
    backgroundColor: colors.primary,
    border: `${borderWidth.default} solid ${colors.primary}`,
    borderRadius: borderRadius.full,
    cursor: 'pointer'
  },
  cards: { display: 'flex', gap: spacing.md, flexWrap: 'wrap' },
  card: {
    flex: '1 1 220px',
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.xs,
    padding: padding.card,
    backgroundColor: colors.bg.muted,
    border: `${borderWidth.default} solid ${colors.border.light}`,
    borderRadius: borderRadius.lg
  },
  cardLabel: { fontSize: fontSize.sm, color: colors.text.muted },
  cardValue: { fontSize: fontSize.xxl, fontWeight: fontWeight.semibold, color: colors.text.primary },
  tableWrapper: {
    overflowX: 'auto',
    overflowY: 'auto',
    maxHeight: sizes.installmentListHeight,
    overscrollBehavior: 'contain',
    border: `${borderWidth.default} solid ${colors.border.subtle}`,
    borderRadius: borderRadius.lg,
  },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: {
    padding: padding.tableCell,
    textAlign: 'left',
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.text.muted,
    borderBottom: `${borderWidth.thick} solid ${colors.border.divider}`,
    position: 'sticky' as const,
    top: 0,
    zIndex: zIndex.sticky,
    backgroundColor: colors.bg.card
  },
  thRight: {
    padding: padding.tableCell,
    textAlign: 'right',
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.text.muted,
    borderBottom: `${borderWidth.thick} solid ${colors.border.divider}`,
    position: 'sticky' as const,
    top: 0,
    zIndex: zIndex.sticky,
    backgroundColor: colors.bg.card
  },
  td: {
    padding: padding.tableCell,
    fontSize: fontSize.base,
    borderBottom: `${borderWidth.default} solid ${colors.border.light}`
  },
  tdRight: {
    padding: padding.tableCell,
    fontSize: fontSize.base,
    textAlign: 'right',
    borderBottom: `${borderWidth.default} solid ${colors.border.light}`
  },
  badge: {
    display: 'inline-block',
    padding: padding.badge,
    borderRadius: borderRadius.sm,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium
  },
  linkButton: {
    padding: 0,
    fontSize: fontSize.base,
    color: colors.primary,
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    textAlign: 'left' as const
  },
  actions: { display: 'flex', gap: spacing.xs, flexWrap: 'wrap' },
  smallButton: {
    padding: padding.badge,
    fontSize: fontSize.sm,
    color: colors.text.muted,
    backgroundColor: colors.bg.muted,
    border: `${borderWidth.default} solid ${colors.border.default}`,
    borderRadius: borderRadius.md,
    cursor: 'pointer'
  },
  primarySmallButton: {
    padding: padding.badge,
    fontSize: fontSize.sm,
    color: colors.text.inverse,
    backgroundColor: colors.primary,
    border: 'none',
    borderRadius: borderRadius.md,
    cursor: 'pointer'
  },
  empty: {
    padding: spacing.xl,
    textAlign: 'center',
    fontSize: fontSize.base,
    color: colors.text.disabled
  },
  editField: { marginBottom: spacing.md },
  editLabel: {
    display: 'block',
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
    color: colors.text.muted,
    marginBottom: spacing.xs
  },
  editInput: {
    width: '100%',
    padding: padding.input,
    fontSize: fontSize.base,
    border: `${borderWidth.default} solid ${colors.border.input}`,
    borderRadius: borderRadius.md,
    boxSizing: 'border-box'
  },
  editActions: { display: 'flex', justifyContent: 'flex-end', gap: spacing.sm, marginTop: spacing.lg },
  cancelButton: {
    padding: padding.button,
    fontSize: fontSize.sm,
    color: colors.text.muted,
    backgroundColor: colors.bg.hover,
    border: 'none',
    borderRadius: borderRadius.md,
    cursor: 'pointer'
  }
}

export default InstallmentSummary
