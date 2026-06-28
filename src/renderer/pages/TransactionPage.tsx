import { useState, useMemo, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useAppStore } from '../../core/store/useAppStore'
import { TransactionFilter } from '../../core/models/types'
import { TransactionService } from '../../core/services/TransactionService'
import { ExportService } from '../../core/services/ExportService'
import TransactionList from '../components/TransactionList'
import TransactionForm from '../components/TransactionForm'
import SearchBar from '../components/SearchBar'
import FilterPanel from '../components/FilterPanel'

function TransactionPage(): JSX.Element {
  const { t } = useTranslation()
  const {
    dataset,
    addTransaction,
    updateTransaction,
    filters,
    sortConfig,
    setFilters,
    setSortConfig,
    clearDataset,
    updateSettings
  } = useAppStore()
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [searchKeyword, setSearchKeyword] = useState('')
  const [keepFormOpen, setKeepFormOpen] = useState(false)
  const [showExportMenu, setShowExportMenu] = useState(false)
  const [exporting, setExporting] = useState(false)

  const transactions = dataset?.transactions ?? []
  const categories = dataset?.categories ?? []

  const filteredTransactions = useMemo(() => {
    let result = transactions

    if (searchKeyword) {
      result = TransactionService.search(result, searchKeyword)
    }

    const activeFilter: TransactionFilter = {
      ...filters,
      keyword: searchKeyword || undefined
    }
    result = TransactionService.filter(result, activeFilter)

    result = TransactionService.sort(result, sortConfig)
    return result
  }, [transactions, searchKeyword, filters, sortConfig])

  const handleSave = useCallback(
    (data: {
      date: string
      title: string
      categoryId: string
      type: import('../../core/models/types').TransactionType
      amount: number
      notes: string
    }) => {
      if (editId) {
        updateTransaction(editId, data)
        setEditId(null)
      } else {
        addTransaction(data)
      }
      if (!keepFormOpen) {
        setShowForm(false)
      }
    },
    [editId, updateTransaction, addTransaction, keepFormOpen]
  )

  const handleExport = useCallback(
    async (format: 'csv' | 'xlsx') => {
      if (!dataset) return
      setExporting(true)
      setShowExportMenu(false)
      try {
        if (format === 'csv') {
          const csv = ExportService.toTransactionCSV(transactions, categories)
          const result = await window.api.export.showSaveDialog('transactions.csv', [
            { name: 'CSV', extensions: ['csv'] }
          ])
          if (result.canceled || !result.filePath) return
          await window.api.export.saveFile(result.filePath, csv)
        } else {
          const base64 = ExportService.toTransactionXLSXBase64(transactions, categories)
          const result = await window.api.export.showSaveDialog('transactions.xlsx', [
            { name: 'Excel', extensions: ['xlsx'] }
          ])
          if (result.canceled || !result.filePath) return
          await window.api.export.saveFileBinary(result.filePath, base64)
        }
      } catch (err) {
        console.error('Export failed:', err)
        alert(err instanceof Error ? err.message : 'Export failed')
      } finally {
        setExporting(false)
      }
    },
    [dataset, transactions, categories]
  )

  const handleEdit = useCallback((id: string) => {
    setEditId(id)
    setShowForm(true)
  }, [])

  const editingTransaction = editId
    ? transactions.find((t) => t.id === editId)
    : undefined

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>{t('transaction.title')}</h2>
        <div style={styles.headerRight}>
          <label style={styles.checkboxLabel}>
            <input
              type="checkbox"
              checked={keepFormOpen}
              onChange={(e) => setKeepFormOpen(e.target.checked)}
            />
            {t('transaction.batchMode')}
          </label>
          <div style={styles.exportWrapper}>
            <button style={styles.exportBtn} onClick={() => setShowExportMenu(!showExportMenu)} disabled={exporting}>
              {exporting ? t('common.loading') : t('common.export')}
            </button>
            {showExportMenu && (
              <div style={styles.exportDropdown}>
                <button style={styles.dropdownItem} onClick={() => handleExport('csv')}>
                  CSV
                </button>
                <button style={styles.dropdownItem} onClick={() => handleExport('xlsx')}>
                  XLSX
                </button>
              </div>
            )}
          </div>
          <button style={styles.closeBtn} onClick={() => { clearDataset(); updateSettings({ lastOpenedDataset: null }) }}>
            {t('common.closeDataset')}
          </button>
          <button style={styles.addBtn} onClick={() => { setShowForm(true); setEditId(null) }}>
            {t('transaction.add')}
          </button>
        </div>
      </div>

      <div style={styles.toolbar}>
        <SearchBar onSearch={setSearchKeyword} />
        <FilterPanel categories={categories} onApply={setFilters} onClearSearch={() => setSearchKeyword('')} />
      </div>

      {showForm && (
        <div style={styles.formSection}>
          <TransactionForm
            transaction={editingTransaction}
            categories={categories}
            onSave={handleSave}
            onCancel={() => { setShowForm(false); setEditId(null) }}
          />
        </div>
      )}

      <TransactionList transactions={filteredTransactions} onEdit={handleEdit} />
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  container: { padding: '24px' },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px'
  },
  title: { fontSize: '20px', fontWeight: 600, margin: 0, color: '#1a1a1a' },
  headerRight: { display: 'flex', alignItems: 'center', gap: '12px' },
  checkboxLabel: { fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' },
  exportWrapper: { position: 'relative', display: 'inline-block' },
  exportBtn: {
    padding: '8px 16px',
    fontSize: '14px',
    fontWeight: 600,
    color: '#fff',
    backgroundColor: '#28a745',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer'
  },
  exportDropdown: {
    position: 'absolute',
    top: '100%',
    right: 0,
    marginTop: '4px',
    backgroundColor: '#fff',
    border: '1px solid #ddd',
    borderRadius: '6px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
    zIndex: 10,
    minWidth: '120px'
  },
  dropdownItem: {
    display: 'block',
    width: '100%',
    padding: '8px 16px',
    fontSize: '13px',
    textAlign: 'left',
    border: 'none',
    backgroundColor: 'transparent',
    cursor: 'pointer'
  },
  closeBtn: {
    padding: '8px 16px',
    fontSize: '14px',
    fontWeight: 600,
    color: '#666',
    backgroundColor: '#f0f0f0',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer'
  },
  addBtn: {
    padding: '8px 16px',
    fontSize: '14px',
    fontWeight: 600,
    color: '#fff',
    backgroundColor: '#4A90D9',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer'
  },
  toolbar: { marginBottom: '16px' },
  formSection: {
    border: '1px solid #e0e0e0',
    borderRadius: '8px',
    marginBottom: '16px',
    backgroundColor: '#fafafa'
  }
}

export default TransactionPage
