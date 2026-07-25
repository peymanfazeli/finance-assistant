import { useState, useCallback, useMemo } from 'react'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { useAppStore } from '../../core/store/useAppStore'
import { colors, spacing, fontSize, fontWeight, borderRadius, padding, borderWidth } from '../../core/utils/styles'
import { addToast } from '../components/ToastContainer'
import ReceivableList from '../components/ReceivableList'
import ReceivableForm from '../components/ReceivableForm'
import ReceivableDetailModal from '../components/ReceivableDetailModal'
import PersianCalendar from '../components/PersianCalendar'
import { ReceivableService } from '../../core/services/ReceivableService'
import Modal from '../components/Modal'

function ReceivablePage(): JSX.Element {
  const { t } = useTranslation()
  const {
    dataset,
    addReceivable,
    updateReceivable,
  } = useAppStore()
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [detailId, setDetailId] = useState<string | null>(null)
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  const receivables = dataset?.receivables ?? []
  const transactions = dataset?.transactions ?? []
  const categories = dataset?.categories ?? []

  const hasDateFilter = dateFrom !== '' || dateTo !== ''

  const filteredReceivables = useMemo(() => {
    if (!hasDateFilter) {
      return receivables.filter((r) => {
        const remaining = ReceivableService.getRemainingAmount(r, transactions)
        return remaining > 0
      })
    }
    return receivables.filter((r) => {
      const dateStr = r.askDate || r.createdAt.slice(0, 10)
      if (dateFrom && dateStr < dateFrom) return false
      if (dateTo && dateStr > dateTo) return false
      return true
    })
  }, [receivables, transactions, hasDateFilter, dateFrom, dateTo])

  const handleSave = useCallback(
    (data: {
      title: string
      categoryId: string
      totalAmount: number
      from: string
      notes: string
      askDate?: string
    }) => {
      if (editId) {
        updateReceivable(editId, data)
        addToast('success', t('receivable.updated'))
        setEditId(null)
      } else {
        addReceivable(data)
        addToast('success', t('receivable.created'))
      }
      setShowForm(false)
    },
    [editId, updateReceivable, addReceivable, t]
  )

  const handleEdit = useCallback((id: string) => {
    setEditId(id)
    setShowForm(true)
  }, [])

  const handleClick = useCallback((id: string) => {
    setDetailId(id)
  }, [])

  const editingReceivable = editId
    ? receivables.find((r) => r.id === editId)
    : undefined

  const detailReceivable = detailId
    ? receivables.find((r) => r.id === detailId) ?? null
    : null

  return (
    <motion.div style={styles.container}>
      <div style={styles.header}>
        <div>
          <h2 style={styles.title}>{t('receivable.title')}</h2>
          <p style={styles.subtitle}>
            {hasDateFilter
              ? `${filteredReceivables.length} ${t('receivable.title').toLowerCase()}`
              : `${filteredReceivables.length} active`}
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
            {t('receivable.add')}
          </motion.button>
        </div>
      </div>

      <div style={{ overflowY: 'scroll', maxHeight: 'calc(100vh - 200px)' }}>
        <ReceivableList
          receivables={filteredReceivables}
          transactions={transactions}
          categories={categories}
          onEdit={handleEdit}
          onClick={handleClick}
        />
      </div>

      <Modal
        open={showForm}
        onClose={() => { setShowForm(false); setEditId(null) }}
        title={editId ? t('receivable.edit') : t('receivable.add')}
      >
        <ReceivableForm
          receivable={editingReceivable}
          categories={categories}
          onSave={handleSave}
          onCancel={() => { setShowForm(false); setEditId(null) }}
        />
      </Modal>

      <ReceivableDetailModal
        receivable={detailReceivable}
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

export default ReceivablePage
