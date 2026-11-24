import { useState, useCallback, useMemo } from 'react'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { useAppStore } from '../../core/store/useAppStore'
import { Payable, PayableInstallment } from '../../core/models/types'
import { colors, spacing, fontSize, fontWeight, borderRadius, padding, borderWidth } from '../../core/utils/styles'
import { addToast } from '../components/ToastContainer'
import PayableList from '../components/PayableList'
import PayableForm, { PAYABLE_FORM_ID } from '../components/PayableForm'
import PayableDetailModal from '../components/PayableDetailModal'
import InstallmentSummary from '../components/InstallmentSummary'
import PersianCalendar from '../components/PersianCalendar'
import { PayableService } from '../../core/services/PayableService'
import Modal from '../components/Modal'

function PayablePage(): JSX.Element {
  const { t } = useTranslation()
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

  const hasDateFilter = dateFrom !== '' || dateTo !== ''

  const filteredPayables = useMemo(() => {
    if (!hasDateFilter) {
      return payables.filter((p) => {
        const remaining = PayableService.getRemainingAmount(p, transactions)
        return remaining > 0
      })
    }
    return payables.filter((p) => {
      const dateStr = p.dueDate || p.createdAt.slice(0, 10)
      if (dateFrom && dateStr < dateFrom) return false
      if (dateTo && dateStr > dateTo) return false
      return true
    })
  }, [payables, transactions, hasDateFilter, dateFrom, dateTo])

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

  const editingPayable = editId
    ? payables.find((p) => p.id === editId)
    : undefined

  const detailPayable = detailId
    ? payables.find((p) => p.id === detailId) ?? null
    : null

  const closeForm = useCallback(() => {
    setShowForm(false)
    setEditId(null)
  }, [])

  return (
    <motion.div style={styles.container}>
      <div style={styles.header}>
        <div>
          <h2 style={styles.title}>{t('payable.title')}</h2>
          <p style={styles.subtitle}>
            {hasDateFilter
              ? `${filteredPayables.length} ${t('payable.title').toLowerCase()}`
              : `${filteredPayables.length} ${t('common.active')}`}
          </p>
        </div>
        <div style={styles.headerRight}>
          <div style={styles.dateFilter}>
            <PersianCalendar value={dateFrom} onChange={setDateFrom} placeholder={t('common.from')} compact />
            <span style={styles.dateSep}>-</span>
            <PersianCalendar value={dateTo} onChange={setDateTo} placeholder={t('common.to')} compact />
            {hasDateFilter && (
              <button
                style={styles.clearBtn}
                onClick={() => { setDateFrom(''); setDateTo('') }}
              >
                ✕
              </button>
            )}
          </div>
          <motion.button
            style={styles.addBtn}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => { setShowForm(true); setEditId(null) }}
          >
            {t('payable.add')}
          </motion.button>
        </div>
      </div>

      <div style={{ overflowY: 'scroll', maxHeight: 'calc(100vh - 200px)' }}>
        <PayableList
          payables={filteredPayables}
          transactions={transactions}
          categories={categories}
          onEdit={handleEdit}
          onClick={handleClick}
        />
      </div>

      <InstallmentSummary
        payables={payables}
        currency={dataset?.currency ?? 'USD'}
        onUpdateInstallment={handleUpdateInstallment}
        onSetInstallmentPaid={handleSetInstallmentPaid}
        onViewPayable={handleClick}
      />

      <Modal
        open={showForm}
        onClose={closeForm}
        title={editId ? t('payable.edit') : t('payable.add')}
        footer={
          <>
            <button type="button" style={styles.footerCancelBtn} onClick={closeForm}>
              {t('common.cancel')}
            </button>
            <button type="submit" form={PAYABLE_FORM_ID} style={styles.footerSaveBtn}>
              {t('common.save')}
            </button>
          </>
        }
      >
        <PayableForm
          payable={editingPayable}
          categories={categories}
          currency={dataset?.currency ?? 'USD'}
          onSave={handleSave}
        />
      </Modal>

      <PayableDetailModal
        payable={detailPayable}
        open={detailId !== null}
        onClose={() => setDetailId(null)}
      />
    </motion.div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  container: { padding: padding.page },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.lg,
  },
  title: { fontSize: fontSize.xxl, fontWeight: fontWeight.semibold, margin: 0, color: colors.text.primary },
  subtitle: { fontSize: fontSize.sm, color: colors.text.disabled, margin: `${spacing.xs} 0 0` },
  headerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: spacing.md,
  },
  dateFilter: {
    display: 'flex',
    alignItems: 'center',
    gap: spacing.xs,
  },
  dateSep: { color: colors.text.disabled },
  clearBtn: {
    padding: `${spacing.xs} ${spacing.sm}`,
    fontSize: fontSize.sm,
    color: colors.text.muted,
    backgroundColor: colors.bg.muted,
    border: `${borderWidth.default} solid ${colors.border.light}`,
    borderRadius: borderRadius.sm,
    cursor: 'pointer',
  },
  addBtn: {
    padding: padding.button,
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    color: colors.text.inverse,
    backgroundColor: colors.primary,
    border: 'none',
    borderRadius: borderRadius.md,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  },
  footerCancelBtn: {
    padding: padding.button,
    fontSize: fontSize.md,
    color: colors.text.muted,
    backgroundColor: colors.bg.hover,
    border: 'none',
    borderRadius: borderRadius.md,
    cursor: 'pointer',
  },
  footerSaveBtn: {
    padding: padding.button,
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
    color: colors.text.inverse,
    backgroundColor: colors.primary,
    border: 'none',
    borderRadius: borderRadius.md,
    cursor: 'pointer',
  },
}

export default PayablePage
