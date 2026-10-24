import { useState, useCallback, useMemo } from 'react'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { useAppStore } from '../../core/store/useAppStore'
import { colors, spacing, fontSize, fontWeight, borderRadius, padding, borderWidth } from '../../core/utils/styles'
import { addToast } from '../components/ToastContainer'
import PayableList from '../components/PayableList'
import PayableForm from '../components/PayableForm'
import PayableDetailModal from '../components/PayableDetailModal'
import PersianCalendar from '../components/PersianCalendar'
import { PayableService } from '../../core/services/PayableService'
import Modal from '../components/Modal'

function PayablePage(): JSX.Element {
  const { t } = useTranslation()
  const {
    dataset,
    addPayable,
    updatePayable,
  } = useAppStore()
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [detailId, setDetailId] = useState<string | null>(null)
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  const payables = ((dataset as any)?.payables ?? []) as any[]
  const transactions = dataset?.transactions ?? []
  const categories = dataset?.categories ?? []

  const hasDateFilter = dateFrom !== '' || dateTo !== ''

  const filteredPayables = useMemo(() => {
    if (!hasDateFilter) {
      return payables.filter((p: any) => {
        const remaining = PayableService.getRemainingAmount(p, transactions)
        return remaining > 0
      })
    }
    return payables.filter((p: any) => {
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
    }) => {
      if (editId) {
        updatePayable(editId, data as any)
        addToast('success', t('payable.updated'))
        setEditId(null)
      } else {
        addPayable(data as any)
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

  const editingPayable = editId
    ? payables.find((p: any) => p.id === editId)
    : undefined

  const detailPayable = detailId
    ? payables.find((p: any) => p.id === detailId) ?? null
    : null

  return (
    <motion.div style={styles.container}>
      <div style={styles.header}>
        <div>
          <h2 style={styles.title}>{t('payable.title')}</h2>
          <p style={styles.subtitle}>
            {hasDateFilter
              ? `${filteredPayables.length} ${t('payable.title').toLowerCase()}`
              : `${filteredPayables.length} active`}
          </p>
        </div>
        <div style={styles.headerRight}>
          <div style={styles.dateFilter}>
            <PersianCalendar value={dateFrom} onChange={setDateFrom} placeholder="From" compact />
            <span style={styles.dateSep}>-</span>
            <PersianCalendar value={dateTo} onChange={setDateTo} placeholder="To" compact />
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

      <Modal
        open={showForm}
        onClose={() => { setShowForm(false); setEditId(null) }}
        title={editId ? t('payable.edit') : t('payable.add')}
      >
        <PayableForm
          payable={editingPayable}
          categories={categories}
          onSave={handleSave}
          onCancel={() => { setShowForm(false); setEditId(null) }}
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
}

export default PayablePage
