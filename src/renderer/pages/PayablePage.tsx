import { useCallback, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { Payable, PayableInstallment } from '../../core/models/types'
import { useAppStore } from '../../core/store/useAppStore'
import {
  formatJalaliDate,
  gregorianDateToJalali,
  getTodayJalali,
  jalaliToGregorianDateStrFromParts,
  toPersianDigits,
} from '../../core/utils/jalali'
import { formatCurrency } from '../../core/utils/format'
import {
  colors,
  fontSize,
  fontWeight,
  spacing,
  borderWidth,
  borderRadius,
  transitions,
} from '../../core/utils/styles'
import { PayableService } from '../../core/services/PayableService'
import { PayableInstallmentService } from '../../core/services/PayableInstallmentService'
import PageHeader from '../components/PageHeader'
import BentoCard from '../components/BentoCard'
import MetricTile from '../components/MetricTile'
import PayableList from '../components/PayableList'
import PayableForm, { PAYABLE_FORM_ID } from '../components/PayableForm'
import PayableDetailModal from '../components/PayableDetailModal'
import InstallmentSummary from '../components/InstallmentSummary'
import PersianCalendar from '../components/PersianCalendar'
import Modal from '../components/Modal'
import { addToast } from '../components/ToastContainer'
import { uiStyles } from '../uiStyles'

function PayablePage(): JSX.Element {
  const { t, i18n } = useTranslation()
  const {
    dataset,
    addPayable,
    updatePayable,
    updateInstallment,
    setInstallmentPaid,
  } = useAppStore()
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [detailId, setDetailId] = useState<string | null>(null)
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  const payables: Payable[] = dataset?.payables ?? []
  const transactions = dataset?.transactions ?? []
  const categories = dataset?.categories ?? []
  const currency = dataset?.currency ?? 'USD'
  const locale = i18n.language === 'fa' ? 'fa-IR' : 'en-US'
  const usePersianDigits = i18n.language === 'fa'
  const hasDateFilter = dateFrom !== '' || dateTo !== ''

  const filteredPayables = useMemo(() => {
    if (!hasDateFilter) {
      return payables.filter((p) => PayableService.getRemainingAmount(p, transactions) > 0)
    }
    return payables.filter((p) => {
      const dateStr = p.dueDate || p.createdAt.slice(0, 10)
      if (dateFrom && dateStr < dateFrom) return false
      if (dateTo && dateStr > dateTo) return false
      return true
    })
  }, [payables, transactions, hasDateFilter, dateFrom, dateTo])

  const metrics = useMemo(() => {
    const todayJalali = getTodayJalali()
    const todayStr = jalaliToGregorianDateStrFromParts(todayJalali.jy, todayJalali.jm, todayJalali.jd)
    let total = 0
    let paid = 0
    let dueThisMonth = 0
    let overdue = 0
    let activeCount = 0

    for (const payable of payables) {
      const remaining = PayableService.getRemainingAmount(payable, transactions)
      total += payable.totalAmount
      paid += PayableService.getPaidAmount(payable, transactions)

      if (remaining > 0) {
        activeCount += 1
        if (payable.dueDate) {
          try {
            const due = gregorianDateToJalali(payable.dueDate)
            if (due.jy === todayJalali.jy && due.jm === todayJalali.jm) {
              dueThisMonth += remaining
            }
          } catch {
            dueThisMonth += 0
          }
          if (payable.dueDate < todayStr) overdue += remaining
        }
      }
    }

    const installmentRows = PayableInstallmentService.getRows(payables)
    return {
      total,
      paid,
      remaining: total - paid,
      dueThisMonth,
      overdue,
      activeCount,
      pendingInstallments: installmentRows.filter((row) => row.state !== 'paid').length,
      upcoming: installmentRows.filter((row) => row.state === 'pending').slice(0, 4),
    }
  }, [payables, transactions])

  const countText = (value: number): string => usePersianDigits ? toPersianDigits(value) : String(value)
  const money = (value: number): string => formatCurrency(value, currency, locale)

  const handleSave = useCallback(
    (data: {
      title: string
      categoryId: string
      totalAmount: number
      to: string
      notes: string
      dueDate?: string
      installments?: PayableInstallment[]
    }) => {
      if (editId) {
        updatePayable(editId, data)
        addToast('success', t('payable.updated'))
        setEditId(null)
      } else {
        addPayable(data)
        addToast('success', t('payable.created'))
      }
      setShowForm(false)
    },
    [editId, updatePayable, addPayable, t]
  )

  const handleEdit = useCallback((id: string) => {
    setEditId(id)
    setShowForm(true)
  }, [])

  const handleClick = useCallback((id: string) => {
    setDetailId(id)
  }, [])

  const handleUpdateInstallment = useCallback((
    payableId: string,
    installmentId: string,
    updates: { amount?: number; dueDate?: string }
  ) => {
    updateInstallment(payableId, installmentId, updates)
    addToast('success', t('installment.created'))
  }, [updateInstallment, t])

  const handleSetInstallmentPaid = useCallback((payableId: string, installmentId: string, paid: boolean) => {
    setInstallmentPaid(payableId, installmentId, paid)
    addToast('success', t(paid ? 'installment.markedPaid' : 'installment.reverted'))
  }, [setInstallmentPaid, t])

  const editingPayable = editId ? payables.find((p) => p.id === editId) : undefined
  const detailPayable = detailId ? payables.find((p) => p.id === detailId) ?? null : null

  const closeForm = useCallback(() => {
    setShowForm(false)
    setEditId(null)
  }, [])

  return (
    <div style={styles.container}>
      <PageHeader
        title={t('payable.title')}
        description={t('payable.description')}
        actions={
          <>
            <div style={styles.dateFilter}>
              <PersianCalendar value={dateFrom} onChange={setDateFrom} placeholder={t('common.from')} compact />
              <span style={styles.dateSep}>{t('common.to')}</span>
              <PersianCalendar value={dateTo} onChange={setDateTo} placeholder={t('common.to')} compact />
              {hasDateFilter && (
                <button
                  type="button"
                  style={uiStyles.iconButton}
                  onClick={() => { setDateFrom(''); setDateTo('') }}
                  aria-label={t('common.clear')}
                >
                  ✕
                </button>
              )}
            </div>
            <motion.button
              type="button"
              style={uiStyles.button}
              whileHover={{ opacity: 0.9 }}
              whileTap={{ opacity: 0.8 }}
              onClick={() => { setShowForm(true); setEditId(null) }}
            >
              {t('payable.add')}
            </motion.button>
          </>
        }
      />

      <div className="pfa-bento-grid" style={styles.metricsGrid}>
        <BentoCard span={3} compact>
          <MetricTile label={t('payable.totalAmount')} value={money(metrics.total)} hint={money(metrics.paid) + ' ' + t('payable.paid')} />
        </BentoCard>
        <BentoCard span={3} compact tone="accent">
          <MetricTile label={t('payable.remaining')} value={money(metrics.remaining)} tone="primary" />
        </BentoCard>
        <BentoCard span={3} compact>
          <MetricTile label={t('payable.activeCount')} value={countText(metrics.activeCount)} />
        </BentoCard>
        <BentoCard span={3} compact tone="accent">
          <MetricTile label={t('payable.pendingInstallments')} value={countText(metrics.pendingInstallments)} tone="primary" />
        </BentoCard>
      </div>

      <div className="pfa-bento-grid">
        <BentoCard
          span={8}
          title={t('payable.title')}
          description={hasDateFilter
            ? `${countText(filteredPayables.length)} ${t('payable.title').toLowerCase()}`
            : `${countText(filteredPayables.length)} ${t('common.active')}`}
        >
          <div style={styles.listScroll}>
            <PayableList
              payables={filteredPayables}
              transactions={transactions}
              categories={categories}
              onEdit={handleEdit}
              onClick={handleClick}
            />
          </div>
        </BentoCard>

        <BentoCard span={4} title={t('installment.summaryTitle')} compact>
          <InstallmentSummary
            payables={payables}
            currency={currency}
            onUpdateInstallment={handleUpdateInstallment}
            onSetInstallmentPaid={handleSetInstallmentPaid}
            onViewPayable={handleClick}
          />
          <div style={styles.upcoming}>
            <h4 style={styles.upcomingTitle}>{t('payable.upcomingTitle')}</h4>
            {metrics.upcoming.length === 0 ? (
              <p style={styles.emptyText}>{t('payable.upcomingEmpty')}</p>
            ) : (
              <div style={styles.upcomingRows}>
                {metrics.upcoming.map((row) => (
                  <button
                    key={row.installment.id}
                    type="button"
                    style={styles.upcomingRow}
                    onClick={() => handleClick(row.payableId)}
                  >
                    <span style={styles.upcomingName}>{row.payableTitle}</span>
                    <span style={styles.upcomingDate}>{formatJalaliDate(row.installment.dueDate, usePersianDigits)}</span>
                    <span style={styles.upcomingAmount}>{money(row.installment.amount)}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </BentoCard>
      </div>

      <Modal
        open={showForm}
        onClose={closeForm}
        title={editId ? t('payable.edit') : t('payable.add')}
        footer={
          <>
            <button type="button" style={uiStyles.buttonSecondary} onClick={closeForm}>
              {t('common.cancel')}
            </button>
            <button type="submit" form={PAYABLE_FORM_ID} style={uiStyles.button}>
              {t('common.save')}
            </button>
          </>
        }
      >
        <PayableForm
          payable={editingPayable}
          categories={categories}
          currency={currency}
          onSave={handleSave}
        />
      </Modal>

      <PayableDetailModal
        payable={detailPayable}
        open={detailId !== null}
        onClose={() => setDetailId(null)}
      />
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.xxl,
    minWidth: 0,
  },
  metricsGrid: {
    marginBottom: 0,
  },
  dateFilter: {
    display: 'flex',
    alignItems: 'center',
    gap: spacing.xs,
    flexWrap: 'wrap',
  },
  dateSep: {
    color: colors.text.muted,
    fontSize: fontSize.sm,
  },
  listScroll: {
    overflowX: 'auto',
    overflowY: 'auto',
    maxHeight: '420px',
    overscrollBehavior: 'contain',
    border: `${borderWidth.default} solid ${colors.border.subtle}`,
    borderRadius: borderRadius.lg,
  },
  upcoming: {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.sm,
    paddingTop: spacing.md,
    borderTop: `${borderWidth.default} solid ${colors.border.default}`,
  },
  upcomingTitle: {
    margin: 0,
    color: colors.text.secondary,
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
  },
  upcomingRows: {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.xs,
  },
  upcomingRow: {
    display: 'grid',
    gridTemplateColumns: 'minmax(0, 1fr) auto auto',
    gap: spacing.sm,
    alignItems: 'center',
    width: '100%',
    padding: `${spacing.sm} ${spacing.md}`,
    textAlign: 'start',
    backgroundColor: colors.bg.subtle,
    border: `${borderWidth.default} solid ${colors.border.subtle}`,
    borderRadius: borderRadius.md,
    cursor: 'pointer',
    transition: transitions.fast,
  },
  upcomingName: {
    minWidth: 0,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    color: colors.text.secondary,
    fontSize: fontSize.sm,
  },
  upcomingDate: {
    color: colors.text.muted,
    fontSize: fontSize.xs,
    whiteSpace: 'nowrap',
  },
  upcomingAmount: {
    color: colors.text.primary,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    fontVariantNumeric: 'tabular-nums',
    whiteSpace: 'nowrap',
  },
  emptyText: {
    margin: 0,
    color: colors.text.muted,
    fontSize: fontSize.sm,
  },
}

export default PayablePage
