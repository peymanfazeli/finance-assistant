import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Payable, TransactionType, InstallmentRow } from '../../core/models/types'
import { PayableService } from '../../core/services/PayableService'
import { PayableInstallmentService } from '../../core/services/PayableInstallmentService'
import { useAppStore } from '../../core/store/useAppStore'
import { formatCurrency } from '../../core/utils/format'
import { formatJalaliDate, formatJalaliDateEn } from '../../core/utils/jalali'
import { colors, spacing, fontSize, fontWeight, borderRadius, padding, borderWidth } from '../../core/utils/styles'
import Modal from './Modal'
import PersianCalendar from './PersianCalendar'
import { addToast } from './ToastContainer'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'

interface PayableDetailModalProps {
  payable: Payable | null
  open: boolean
  onClose: () => void
}

function PayableDetailModal({ payable, open, onClose }: PayableDetailModalProps): JSX.Element {
  const { t, i18n } = useTranslation()
  const { dataset, addTransaction } = useAppStore()
  const locale = i18n.language === 'fa' ? 'fa-IR' : 'en-US'
  const usePersianDigits = i18n.language === 'fa'
  const currency = dataset?.currency || 'toman'
  const transactions = dataset?.transactions ?? []
  const allPayables = dataset?.payables ?? []
  const categories = dataset?.categories ?? []
  const [selectedInstallmentId, setSelectedInstallmentId] = useState('')
  const [paymentAmount, setPaymentAmount] = useState('')
  const [paymentDate, setPaymentDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [paymentError, setPaymentError] = useState('')

  const linkedTransactions = useMemo(() => {
    if (!payable) return []
    return PayableService.getPaymentTransactions(payable, transactions, allPayables)
      .sort((a, b) => a.date.localeCompare(b.date))
  }, [payable, transactions])

  const paidAmount = useMemo(() => {
    if (!payable) return 0
    return PayableService.getPaidAmount(payable, transactions, allPayables)
  }, [payable, transactions])

  const remainingAmount = useMemo(() => {
    if (!payable) return 0
    return PayableService.getRemainingAmount(payable, transactions, allPayables)
  }, [payable, transactions])

  const paidDate = useMemo(() => {
    if (!payable) return null
    return PayableService.getPaidDate(payable, transactions, allPayables)
  }, [payable, transactions])

  const paymentSource = useMemo(() => {
    if (!payable) return 'none'
    return PayableService.getPaymentSource(payable, transactions, allPayables)
  }, [payable, transactions])

  const rows = useMemo(() => {
    if (!payable) return []
    return PayableInstallmentService.getRows([payable], transactions)
  }, [payable, transactions])

  const chartData = useMemo(() => {
    return linkedTransactions.map((tx) => ({
      date: tx.date,
      amount: tx.amount,
      title: tx.title
    }))
  }, [linkedTransactions])

  const selectedRow = rows.find((row) => row.installment.id === selectedInstallmentId)
  const targetRemaining = selectedRow
    ? selectedRow.remainingAmount
    : payable
      ? PayableService.getRemainingAmount(payable, transactions, allPayables)
      : 0

  useEffect(() => {
    setSelectedInstallmentId(rows.find((row) => row.state !== 'paid')?.installment.id ?? '')
    setPaymentDate(new Date().toISOString().slice(0, 10))
    setPaymentError('')
  }, [payable?.id])

  useEffect(() => {
    setPaymentAmount((Math.round(targetRemaining * 100) / 100).toString())
  }, [targetRemaining, selectedInstallmentId])

  const category = payable ? categories.find((c) => c.id === payable.categoryId) : null
  const progressPercent = payable && payable.totalAmount > 0
    ? Math.min((paidAmount / payable.totalAmount) * 100, 100)
    : 0

  const stateLabel = (state: InstallmentRow['state']): string =>
    t(`installment.state${state.charAt(0).toUpperCase()}${state.slice(1)}`)

  const stateStyle = (state: InstallmentRow['state']): React.CSSProperties => ({
    ...styles.typeBadge,
    backgroundColor: state === 'paid'
      ? colors.bg.income
      : state === 'overdue'
        ? colors.bg.expense
        : state === 'partial'
          ? colors.bg.active
          : colors.bg.warning,
    color: state === 'paid'
      ? colors.text.income
      : state === 'overdue'
        ? colors.text.expense
        : state === 'partial'
          ? colors.text.primary
          : colors.text.warning
  })

  const installmentNumber = (transactionId?: string): string => {
    if (!payable || !transactionId) return '-'
    const index = (payable.installments ?? []).findIndex((item) => item.id === transactionId)
    return index >= 0 ? String(index + 1) : '-'
  }

  const handleRecordPayment = (): void => {
    if (!payable || !dataset) return
    const amount = Number(paymentAmount)
    const validation = PayableService.validatePayment({
      amount,
      type: TransactionType.Expense,
      categoryId: payable.categoryId,
      payableId: payable.id,
      installmentId: selectedInstallmentId || undefined
    }, dataset.payables ?? [], transactions)
    if (!validation.valid) {
      setPaymentError(t('payable.invalidPayment'))
      return
    }
    try {
      addTransaction({
        date: paymentDate,
        title: t('payable.paymentTitle'),
        categoryId: payable.categoryId,
        type: TransactionType.Expense,
        amount,
        notes: '',
        payableId: payable.id,
        installmentId: selectedInstallmentId || undefined
      })
      setPaymentError('')
      addToast('success', t('payable.paymentRecorded'))
    } catch {
      setPaymentError(t('payable.invalidPayment'))
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={payable?.title ?? ''} width="700px">
      {payable && (
        <div>
          <div style={styles.summaryRow}>
            <div style={styles.summaryItem}>
              <span style={styles.summaryLabel}>{t('payable.to')}</span>
              <span style={styles.summaryValue}>{payable.to}</span>
            </div>
            <div style={styles.summaryItem}>
              <span style={styles.summaryLabel}>{t('payable.dueDate')}</span>
              <span style={styles.summaryValue}>{payable.dueDate ? formatJalaliDate(payable.dueDate, usePersianDigits) : t('common.noData')}</span>
            </div>
            <div style={styles.summaryItem}>
              <span style={styles.summaryLabel}>{t('payable.category')}</span>
              <span style={styles.summaryValue}>{category ? `${category.icon} ${category.name}` : '-'}</span>
            </div>
            <div style={styles.summaryItem}>
              <span style={styles.summaryLabel}>{t('payable.totalAmount')}</span>
              <span style={styles.summaryValue}>{formatCurrency(payable.totalAmount, currency, locale)}</span>
            </div>
            <div style={styles.summaryItem}>
              <span style={styles.summaryLabel}>{t('payable.paid')}</span>
              <span style={{ ...styles.summaryValue, color: colors.text.expense }}>{formatCurrency(paidAmount, currency, locale)}</span>
            </div>
            <div style={styles.summaryItem}>
              <span style={styles.summaryLabel}>{t('payable.remaining')}</span>
              <span style={{ ...styles.summaryValue, color: remainingAmount > 0 ? colors.text.expense : colors.text.income, fontWeight: fontWeight.semibold }}>
                {formatCurrency(remainingAmount, currency, locale)}
              </span>
            </div>
            <div style={styles.summaryItem}>
              <span style={styles.summaryLabel}>{t('payable.paidDate')}</span>
              <span style={styles.summaryValue}>{paidDate ? formatJalaliDate(paidDate, usePersianDigits) : t('common.noData')}</span>
            </div>
          </div>

          <div style={styles.progressContainer}>
            <div style={styles.progressTrack}>
              <div style={{ ...styles.progressFill, width: `${progressPercent}%` }} />
            </div>
            <span style={styles.progressText}>{Math.round(progressPercent)}%</span>
          </div>

          {payable.notes && (
            <div style={styles.notes}>
              <span style={styles.notesLabel}>{t('payable.notes')}:</span> {payable.notes}
            </div>
          )}

          {remainingAmount > 0 && (
            <div style={styles.paymentSection}>
              <h3 style={styles.sectionTitle}>{t('payable.recordPayment')}</h3>
              <div style={styles.paymentGrid}>
                {rows.length > 0 && (
                  <div style={styles.paymentField}>
                    <label style={styles.paymentLabel}>{t('installment.number')}</label>
                    <select
                      aria-label={t('installment.number')}
                      style={styles.paymentInput}
                      value={selectedInstallmentId}
                      onChange={(event) => setSelectedInstallmentId(event.target.value)}
                    >
                      {rows.map((row) => (
                        <option key={row.installment.id} value={row.installment.id}>
                          {row.number} / {row.count} - {formatCurrency(row.remainingAmount, currency, locale)}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                <div style={styles.paymentField}>
                  <label style={styles.paymentLabel}>{t('payable.paymentAmount')}</label>
                  <input
                    aria-label={t('payable.paymentAmount')}
                    style={styles.paymentInput}
                    type="number"
                    step="0.01"
                    min="0"
                    value={paymentAmount}
                    onChange={(event) => setPaymentAmount(event.target.value)}
                  />
                </div>
                <div style={styles.paymentField}>
                  <label style={styles.paymentLabel}>{t('payable.paymentDate')}</label>
                  <PersianCalendar value={paymentDate} onChange={setPaymentDate} compact />
                </div>
              </div>
              <div style={styles.paymentHint}>
                {t('payable.paymentRemaining')}: {formatCurrency(targetRemaining, currency, locale)}
              </div>
              {paymentError && <div style={styles.errorText}>{paymentError}</div>}
              <button type="button" style={styles.recordButton} onClick={handleRecordPayment}>
                {t('payable.recordPayment')}
              </button>
            </div>
          )}

          {rows.length > 0 && (
            <div style={styles.tableSection}>
              <h3 style={styles.sectionTitle}>{t('installment.details')}</h3>
              <div style={styles.tableWrapper}>
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={styles.th}>{t('installment.number')}</th>
                      <th style={styles.th}>{t('installment.dueDate')}</th>
                      <th style={styles.thRight}>{t('installment.amount')}</th>
                      <th style={styles.thRight}>{t('installment.paidAmount')}</th>
                      <th style={styles.thRight}>{t('installment.remainingBalance')}</th>
                      <th style={styles.th}>{t('installment.status')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row) => (
                      <tr key={row.installment.id}>
                        <td style={styles.td}>{row.number} / {row.count}</td>
                        <td style={styles.td}>{formatJalaliDate(row.installment.dueDate, usePersianDigits)}</td>
                        <td style={styles.tdRight}>{formatCurrency(row.installment.amount, currency, locale)}</td>
                        <td style={styles.tdRight}>{formatCurrency(row.paidAmount, currency, locale)}</td>
                        <td style={styles.tdRight}>{formatCurrency(row.remainingAmount, currency, locale)}</td>
                        <td style={styles.td}><span style={stateStyle(row.state)}>{stateLabel(row.state)}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {chartData.length > 0 && (
            <div style={styles.chartSection}>
              <h3 style={styles.sectionTitle}>{t('payable.paidTransactions')}</h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={colors.border.light} />
                  <XAxis dataKey="date" tick={{ fontSize: fontSize.xs, fill: colors.text.muted }} tickFormatter={(d) => formatJalaliDateEn(d)} />
                  <YAxis tick={{ fontSize: fontSize.xs, fill: colors.text.muted }} />
                  <Tooltip
                    formatter={(value) => formatCurrency(Number(value), currency, locale)}
                    labelFormatter={(label) => formatJalaliDateEn(label)}
                    contentStyle={{ fontSize: fontSize.sm, borderRadius: borderRadius.md }}
                  />
                  <Bar dataKey="amount" name={t('payable.paid')} radius={[4, 4, 0, 0]}>
                    {chartData.map((_, idx) => (
                      <Cell key={idx} fill={colors.chart[idx % colors.chart.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          <div style={styles.tableSection}>
            <h3 style={styles.sectionTitle}>{t('payable.transactionDetails')}</h3>
            {linkedTransactions.length === 0 ? (
              <div style={styles.empty}>{t('payable.noLinkedTransactions')}</div>
            ) : (
              <div style={styles.tableWrapper}>
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={styles.th}>{t('transaction.date')}</th>
                      <th style={styles.th}>{t('transaction.titleLabel')}</th>
                      <th style={styles.th}>{t('transaction.type')}</th>
                      <th style={styles.th}>{t('payable.paymentSource')}</th>
                      <th style={styles.th}>{t('payable.linkedInstallment')}</th>
                      <th style={styles.thRight}>{t('transaction.amount')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {linkedTransactions.map((tx) => (
                      <tr key={tx.id}>
                        <td style={styles.td}>{formatJalaliDate(tx.date, usePersianDigits)}</td>
                        <td style={styles.td}>{tx.title}</td>
                        <td style={styles.td}>
                          <span style={{
                            ...styles.typeBadge,
                            backgroundColor:
                              tx.type === TransactionType.Expense ? colors.bg.expense : colors.bg.refund,
                          }}>
                            {t(`transaction.${tx.type}`)}
                          </span>
                        </td>
                        <td style={styles.td}>
                          {t(paymentSource === 'explicit' ? 'payable.paymentSourceExplicit' : 'payable.paymentSourceLegacy')}
                        </td>
                        <td style={styles.td}>{installmentNumber(tx.installmentId)}</td>
                        <td style={styles.tdRight}>{formatCurrency(tx.amount, currency, locale)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </Modal>
  )
}

const styles: Record<string, React.CSSProperties> = {
  summaryRow: {
    display: 'flex',
    gap: spacing.lg,
    flexWrap: 'wrap',
    marginBottom: spacing.lg,
  },
  summaryItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.xs,
    minWidth: '100px',
  },
  summaryLabel: {
    fontSize: fontSize.xs,
    color: colors.text.muted,
    fontWeight: fontWeight.medium,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
  },
  summaryValue: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.text.primary,
  },
  progressContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  progressTrack: {
    flex: 1,
    height: '8px',
    backgroundColor: colors.border.light,
    borderRadius: borderRadius.full,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.danger,
    borderRadius: borderRadius.full,
    transition: 'width 0.3s ease',
  },
  progressText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.danger,
    minWidth: '40px',
    textAlign: 'end' as const,
  },
  notes: {
    fontSize: fontSize.base,
    color: colors.text.subtle,
    marginBottom: spacing.lg,
    padding: spacing.md,
    backgroundColor: colors.bg.muted,
    borderRadius: borderRadius.md,
  },
  notesLabel: {
    fontWeight: fontWeight.semibold,
    color: colors.text.secondary,
  },
  paymentSection: {
    marginBottom: spacing.xl,
    padding: spacing.md,
    backgroundColor: colors.bg.muted,
    border: `${borderWidth.default} solid ${colors.border.light}`,
    borderRadius: borderRadius.lg,
  },
  paymentGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
    gap: spacing.sm,
  },
  paymentField: {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.xs,
  },
  paymentLabel: {
    fontSize: fontSize.sm,
    color: colors.text.muted,
    fontWeight: fontWeight.medium,
  },
  paymentInput: {
    width: '100%',
    padding: padding.input,
    fontSize: fontSize.base,
    border: `${borderWidth.default} solid ${colors.border.input}`,
    borderRadius: borderRadius.md,
    boxSizing: 'border-box',
  },
  paymentHint: {
    marginTop: spacing.sm,
    fontSize: fontSize.sm,
    color: colors.text.muted,
  },
  errorText: {
    marginTop: spacing.sm,
    fontSize: fontSize.sm,
    color: colors.text.error,
  },
  recordButton: {
    marginTop: spacing.md,
    padding: padding.button,
    fontSize: fontSize.sm,
    color: colors.text.inverse,
    backgroundColor: colors.primary,
    border: 'none',
    borderRadius: borderRadius.md,
    cursor: 'pointer',
  },
  chartSection: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    margin: `0 0 ${spacing.md} 0`,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.text.primary,
  },
  tableSection: {
    marginBottom: spacing.md,
  },
  tableWrapper: {
    overflowX: 'auto',
    maxHeight: '250px',
    overflowY: 'auto',
  },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: {
    padding: padding.tableCell,
    textAlign: 'left',
    fontWeight: fontWeight.semibold,
    fontSize: fontSize.sm,
    color: colors.text.muted,
    borderBottom: `${borderWidth.thick} solid ${colors.border.divider}`,
    position: 'sticky' as const,
    top: 0,
    backgroundColor: colors.bg.card,
  },
  thRight: {
    padding: padding.tableCell,
    textAlign: 'right',
    fontWeight: fontWeight.semibold,
    fontSize: fontSize.sm,
    color: colors.text.muted,
    borderBottom: `${borderWidth.thick} solid ${colors.border.divider}`,
    position: 'sticky' as const,
    top: 0,
    backgroundColor: colors.bg.card,
  },
  td: {
    padding: padding.tableCell,
    fontSize: fontSize.base,
    borderBottom: `${borderWidth.default} solid ${colors.border.light}`,
  },
  tdRight: {
    padding: padding.tableCell,
    fontSize: fontSize.base,
    borderBottom: `${borderWidth.default} solid ${colors.border.light}`,
    textAlign: 'right',
  },
  typeBadge: {
    display: 'inline-block',
    padding: padding.badge,
    borderRadius: borderRadius.sm,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  empty: {
    padding: spacing.xl,
    textAlign: 'center',
    color: colors.text.disabled,
    fontSize: fontSize.base,
  },
}

export default PayableDetailModal
