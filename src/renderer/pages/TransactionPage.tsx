import { useState, useMemo, useCallback } from 'react'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { useAppStore } from '../../core/store/useAppStore'
import { TransactionFilter } from '../../core/models/types'
import { TransactionService } from '../../core/services/TransactionService'
import { ExportService } from '../../core/services/ExportService'
import { colors, spacing, fontSize, fontWeight, borderRadius, padding, shadow, zIndex, borderWidth } from '../../core/utils/styles'
import { addToast } from '../components/ToastContainer'
import DropZone from '../components/DropZone'
import { ImportService, ImportedRow, ColumnMapping as ColumnMappingType } from '../../core/services/ImportService'
import TransactionList from '../components/TransactionList'
import TransactionForm from '../components/TransactionForm'
import Modal from '../components/Modal'
import ImportModal from '../components/ImportModal'
import SearchBar from '../components/SearchBar'
import FilterPanel from '../components/FilterPanel'
import { overflow } from 'html2canvas/dist/types/css/property-descriptors/overflow'

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
  const [dropImporting, setDropImporting] = useState(false)
  const [dropImported, setDropImported] = useState<ImportedRow[]>([])
  const [dropDuplicates, setDropDuplicates] = useState<boolean[]>([])
  const [dropSkipIndices, setDropSkipIndices] = useState<Set<number>>(new Set())
  const [dropShowImportModal, setDropShowImportModal] = useState(false)
  const [dropError, setDropError] = useState<string | null>(null)
  const [previewColumns, setPreviewColumns] = useState<string[]>([])
  const [previewRows, setPreviewRows] = useState<Record<string, string>[]>([])
  const [currentMapping, setCurrentMapping] = useState<ColumnMappingType[]>([])

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
        addToast('success', t('transaction.updated'))
        setEditId(null)
      } else {
        addTransaction(data)
        addToast('success', t('transaction.created'))
      }
      if (!keepFormOpen) {
        setShowForm(false)
      }
    },
    [editId, updateTransaction, addTransaction, keepFormOpen, t]
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
        addToast('success', t('common.exportSuccess'))
      } catch (err) {
        console.error('Export failed:', err)
        addToast('error', err instanceof Error ? err.message : 'Export failed')
      } finally {
        setExporting(false)
      }
    },
    [dataset, transactions, categories, t]
  )

  const handleEdit = useCallback((id: string) => {
    setEditId(id)
    setShowForm(true)
  }, [])

  const initiateImport = useCallback(
    async (filePath: string) => {
      setDropError(null)
      setDropImporting(true)
      try {
        const result = await window.api.file.read(filePath)
        if (!result.success || !result.data) {
          setDropError(t('import.importError'))
          setDropImporting(false)
          return
        }

        let preview
        if (result.ext === 'csv') {
          const binary = atob(result.data)
          const bytes = new Uint8Array(binary.length)
          for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
          const text = new TextDecoder('utf-8').decode(bytes)
          preview = ImportService.parseCSV(text)
        } else {
          const binary = atob(result.data)
          const bytes = new Uint8Array(binary.length)
          for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
          preview = ImportService.parseExcel(bytes.buffer)
        }

        setPreviewColumns(preview.columns)
        setPreviewRows(preview.rows)
        setCurrentMapping(preview.suggestedMapping)

        const parsed = ImportService.applyMapping(preview.rows, preview.suggestedMapping)
        setDropImported(parsed)

        const existing = dataset?.transactions ?? []
        const dupFlags = ImportService.detectDuplicates(existing, parsed)
        setDropDuplicates(dupFlags)

        const skipped = new Set<number>()
        dupFlags.forEach((isDup, i) => { if (isDup) skipped.add(i) })
        setDropSkipIndices(skipped)

        setDropShowImportModal(true)
      } catch (err) {
        setDropError(t('import.importError') + ': ' + String(err))
      }
      setDropImporting(false)
    },
    [dataset, t]
  )

  const handleFileDrop = useCallback(
    (filePath: string) => initiateImport(filePath),
    [initiateImport]
  )

  const handleImportClick = useCallback(async (): Promise<void> => {
    const dialogResult = await window.api.file.openDialog()
    if (dialogResult.canceled || !dialogResult.filePaths?.length) return
    initiateImport(dialogResult.filePaths[0])
  }, [initiateImport])

  const handleDropConfirmImport = useCallback((): void => {
    try {
      const remapped = ImportService.applyMapping(previewRows, currentMapping)
      let count = 0
      remapped.forEach((row, i) => {
        if (!dropSkipIndices.has(i)) {
          const category = categories.find(
            (c) => c.name.toLowerCase() === row.category.toLowerCase()
          )
          addTransaction({
            date: row.date,
            title: row.title,
            categoryId: category?.id ?? categories[categories.length - 1]?.id ?? '',
            type: row.type,
            amount: row.amount,
            notes: row.notes,
          })
          count++
        }
      })
      setDropShowImportModal(false)
      setDropImported([])
      setDropError(null)
      addToast('success', t('import.importSuccess', { count }))
    } catch (err) {
      setDropError(err instanceof Error ? err.message : 'Import failed')
    }
  }, [previewRows, currentMapping, dropSkipIndices, categories, addTransaction, t])

  const handleDropCancelImport = useCallback((): void => {
    setDropShowImportModal(false)
    setDropImported([])
    setDropError(null)
  }, [])

  const handleMappingChange = useCallback((mapping: ColumnMappingType[]): void => {
    setCurrentMapping(mapping)
  }, [])

  const handleDropDuplicateToggle = useCallback((index: number): void => {
    setDropSkipIndices((prev) => {
      const next = new Set(prev)
      if (next.has(index)) next.delete(index)
      else next.add(index)
      return next
    })
  }, [])

  const editingTransaction = editId
    ? transactions.find((t) => t.id === editId)
    : undefined

  return (
    <DropZone onFileDrop={handleFileDrop}>
      <motion.div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>{t('transaction.title')}</h2>
        <div style={styles.headerRight}>
          <motion.button
            style={styles.importBtn}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={handleImportClick}
          >
            {t('import.importFile')}
          </motion.button>
          <motion.button
            style={styles.addBtn}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => { setShowForm(true); setEditId(null) }}
          >
            {t('transaction.add')}
          </motion.button>
          <div style={styles.exportWrapper}>
            <motion.button
              style={styles.exportBtn}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setShowExportMenu(!showExportMenu)}
              disabled={exporting}
            >
              {exporting ? t('common.loading') : t('common.export')}
            </motion.button>
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
          <motion.button
            style={styles.closeBtn}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => { clearDataset(); updateSettings({ lastOpenedDataset: null }) }}
          >
            {t('common.closeDataset')}
          </motion.button>
        </div>
      </div>

      <div style={styles.toolbar}>
        <SearchBar onSearch={setSearchKeyword} />
        <FilterPanel categories={categories} onApply={setFilters} onClearSearch={() => setSearchKeyword('')} />
      </div>
      <div style={{overflowY: 'scroll', maxHeight: '350px'}}>
        <TransactionList transactions={filteredTransactions} categories={categories} onEdit={handleEdit} />
      </div>

      <Modal
        open={showForm}
        onClose={() => { setShowForm(false); setEditId(null) }}
        title={editId ? t('transaction.edit') : t('transaction.add')}
      >
        <TransactionForm
          transaction={editingTransaction}
          categories={categories}
          keepOpen={keepFormOpen}
          onKeepOpenChange={setKeepFormOpen}
          onSave={handleSave}
          onCancel={() => { setShowForm(false); setEditId(null) }}
        />
      </Modal>
      {dropError && <p style={styles.dropError}>{dropError}</p>}

      {dropShowImportModal && (
        <ImportModal
          columns={previewColumns}
          rows={previewRows}
          mapping={currentMapping}
          imported={dropImported}
          duplicates={dropDuplicates}
          skipIndices={dropSkipIndices}
          onMappingChange={handleMappingChange}
          onDuplicateToggle={handleDropDuplicateToggle}
          onConfirm={handleDropConfirmImport}
          onCancel={handleDropCancelImport}
        />
      )}
    </motion.div>
    </DropZone>
  )
}

const styles: Record<string, React.CSSProperties> = {
  container: { padding: padding.page },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  title: { fontSize: fontSize.xxl, fontWeight: fontWeight.semibold, margin: 0, color: colors.text.primary },
  headerRight: { display: 'flex', alignItems: 'center', gap: spacing.md },
  exportWrapper: { position: 'relative', display: 'inline-block' },
  exportBtn: {
    padding: padding.button,
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    color: colors.text.inverse,
    backgroundColor: colors.success,
    border: 'none',
    borderRadius: borderRadius.md,
    cursor: 'pointer',
  },
  exportDropdown: {
    position: 'absolute',
    top: '100%',
    right: 0,
    marginTop: spacing.xs,
    backgroundColor: colors.bg.card,
    border: `${borderWidth.default} solid ${colors.border.strong}`,
    borderRadius: borderRadius.md,
    boxShadow: shadow.dropdown,
    zIndex: zIndex.dropdown,
    minWidth: '120px',
  },
  dropdownItem: {
    display: 'block',
    width: '100%',
    padding: padding.button,
    fontSize: fontSize.md,
    textAlign: 'left',
    border: 'none',
    backgroundColor: 'transparent',
    cursor: 'pointer',
  },
  closeBtn: {
    padding: padding.button,
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    color: colors.text.inverse,
    backgroundColor: colors.danger,
    border: 'none',
    borderRadius: borderRadius.md,
    cursor: 'pointer',
  },
  importBtn: {
    padding: padding.button,
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    color: colors.text.inverse,
    backgroundColor: colors.primary,
    border: 'none',
    borderRadius: borderRadius.md,
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
  },
  dropError: { color: colors.text.expense, fontSize: fontSize.base, padding: padding.input, backgroundColor: colors.bg.expense, borderRadius: borderRadius.md, marginTop: spacing.md },
  toolbar: { marginBottom: spacing.lg },
}

export default TransactionPage
