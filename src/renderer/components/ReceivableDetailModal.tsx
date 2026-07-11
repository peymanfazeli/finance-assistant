import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Receivable, Transaction, Category, TransactionType } from '../../core/models/types'
import { ReceivableService } from '../../core/services/ReceivableService'
import { useAppStore } from '../../core/store/useAppStore'
import { formatCurrency } from '../../core/utils/format'
import { colors, spacing, fontSize, fontWeight, borderRadius, padding, borderWidth, shadow } from '../../core/utils/styles'
import Modal from './Modal'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'

interface ReceivableDetailModalProps {
  receivable: Receivable | null
  open: boolean
  onClose: () => void
}

function ReceivableDetailModal({ receivable, open, onClose }: ReceivableDetailModalProps): JSX.Element {
  const { t, i18n } = useTranslation()
  const { dataset } = useAppStore()
  const locale = i18n.language === 'fa' ? 'fa-IR' : 'en-US'
  const currency = dataset?.currency || 'USD'
  const transactions = dataset?.transactions ?? []
  const categories = dataset?.categories ?? []

  const linkedTransactions = useMemo(() => {
    if (!receivable) return []
    return ReceivableService.getLinkedTransactions(receivable, transactions)
      .sort((a, b) => a.date.localeCompare(b.date))
  }, [receivable, transactions])

  const receivedAmount = useMemo(() => {
    if (!receivable) return 0
    return ReceivableService.getReceivedAmount(receivable, transactions)
  }, [receivable, transactions])

  const remainingAmount = useMemo(() => {
    if (!receivable) return 0
    return ReceivableService.getRemainingAmount(receivable, transactions)
  }, [receivable, transactions])

  const chartData = useMemo(() => {
    return linkedTransactions.map((t) => ({
      date: t.date,
      amount: t.amount,
      title: t.title,
    }))
  }, [linkedTransactions])

  const category = receivable ? categories.find((c) => c.id === receivable.categoryId) : null
  const progressPercent = receivable ? Math.min((receivedAmount / receivable.totalAmount) * 100, 100) : 0

  return (
    <Modal open={open} onClose={onClose} title={receivable?.title ?? ''} width="700px">
      {receivable && (
        <div>
          <div style={styles.summaryRow}>
            <div style={styles.summaryItem}>
              <span style={styles.summaryLabel}>{t('receivable.from')}</span>
              <span style={styles.summaryValue}>{receivable.from}</span>
            </div>
            <div style={styles.summaryItem}>
              <span style={styles.summaryLabel}>{t('receivable.category')}</span>
              <span style={styles.summaryValue}>{category ? `${category.icon} ${category.name}` : '-'}</span>
            </div>
            <div style={styles.summaryItem}>
              <span style={styles.summaryLabel}>{t('receivable.totalAmount')}</span>
              <span style={styles.summaryValue}>{formatCurrency(receivable.totalAmount, currency, locale)}</span>
            </div>
            <div style={styles.summaryItem}>
              <span style={styles.summaryLabel}>{t('receivable.received')}</span>
              <span style={{ ...styles.summaryValue, color: colors.text.income }}>{formatCurrency(receivedAmount, currency, locale)}</span>
            </div>
            <div style={styles.summaryItem}>
              <span style={styles.summaryLabel}>{t('receivable.remaining')}</span>
              <span style={{ ...styles.summaryValue, color: remainingAmount > 0 ? colors.text.income : colors.text.expense, fontWeight: fontWeight.semibold }}>
                {formatCurrency(remainingAmount, currency, locale)}
              </span>
            </div>
          </div>

          <div style={styles.progressContainer}>
            <div style={styles.progressTrack}>
              <div style={{ ...styles.progressFill, width: `${progressPercent}%` }} />
            </div>
            <span style={styles.progressText}>{Math.round(progressPercent)}%</span>
          </div>

          {receivable.notes && (
            <div style={styles.notes}>
              <span style={styles.notesLabel}>{t('receivable.notes')}:</span> {receivable.notes}
            </div>
          )}

          {chartData.length > 0 && (
            <div style={styles.chartSection}>
              <h3 style={styles.sectionTitle}>{t('receivable.receivedTransactions')}</h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={colors.border.light} />
                  <XAxis dataKey="date" tick={{ fontSize: fontSize.xs, fill: colors.text.muted }} />
                  <YAxis tick={{ fontSize: fontSize.xs, fill: colors.text.muted }} />
                  <Tooltip
                    formatter={(value) => formatCurrency(Number(value), currency, locale)}
                    contentStyle={{ fontSize: fontSize.sm, borderRadius: borderRadius.md }}
                  />
                  <Bar dataKey="amount" name={t('receivable.received')} radius={[4, 4, 0, 0]}>
                    {chartData.map((_, idx) => (
                      <Cell key={idx} fill={colors.chart[idx % colors.chart.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          <div style={styles.tableSection}>
            <h3 style={styles.sectionTitle}>{t('receivable.transactionDetails')}</h3>
            {linkedTransactions.length === 0 ? (
              <div style={styles.empty}>{t('receivable.noLinkedTransactions')}</div>
            ) : (
              <div style={styles.tableWrapper}>
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={styles.th}>{t('transaction.date')}</th>
                      <th style={styles.th}>{t('transaction.titleLabel')}</th>
                      <th style={styles.th}>{t('transaction.type')}</th>
                      <th style={styles.thRight}>{t('transaction.amount')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {linkedTransactions.map((tx) => (
                      <tr key={tx.id}>
                        <td style={styles.td}>{tx.date}</td>
                        <td style={styles.td}>{tx.title}</td>
                        <td style={styles.td}>
                          <span style={{
                            ...styles.typeBadge,
                            backgroundColor:
                              tx.type === TransactionType.Income ? colors.bg.income : colors.bg.refund,
                          }}>
                            {t(`transaction.${tx.type}`)}
                          </span>
                        </td>
                        <td style={styles.tdRight}>
                          <span style={{ color: colors.text.income }}>
                            {formatCurrency(tx.amount, currency, locale)}
                          </span>
                        </td>
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
    backgroundColor: colors.primary,
    borderRadius: borderRadius.full,
    transition: 'width 0.3s ease',
  },
  progressText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.primary,
    minWidth: '40px',
    textAlign: 'right' as const,
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

export default ReceivableDetailModal
