import { useState } from 'react'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { useAppStore } from '../../core/store/useAppStore'
import { ImportService, ColumnMapping as ColumnMappingType, ImportedRow } from '../../core/services/ImportService'
import { colors, spacing, fontSize, fontWeight, borderRadius, padding } from '../../core/utils/styles'
import { addToast } from '../components/ToastContainer'
import FileSelector from '../components/FileSelector'
import ImportPreview from '../components/ImportPreview'
import ColumnMapping from '../components/ColumnMapping'
import DuplicateReview from '../components/DuplicateReview'
import ImportConfirmDialog from '../components/ImportConfirmDialog'

function ImportPage(): JSX.Element {
  const { t, i18n } = useTranslation()
  const { dataset, addTransaction, addCategory, addReceivable, setConfigBaseName } = useAppStore()
  const locale = i18n.language === 'fa' ? 'fa-IR' : 'en-US'
  const currency = dataset?.currency || 'USD'
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fileName, setFileName] = useState<string>()
  const [columns, setColumns] = useState<string[]>([])
  const [rows, setRows] = useState<Record<string, string>[]>([])
  const [mapping, setMapping] = useState<ColumnMappingType[]>([])
  const [imported, setImported] = useState<ImportedRow[]>([])
  const [duplicates, setDuplicates] = useState<boolean[]>([])
  const [skipIndices, setSkipIndices] = useState<Set<number>>(new Set())
  const [showConfirm, setShowConfirm] = useState(false)

  const handleSelectFile = async (): Promise<void> => {
    setError(null)
    setLoading(true)
    try {
      const dialogResult = await window.api.file.openDialog()
      if (dialogResult.canceled || dialogResult.filePaths.length === 0) {
        setLoading(false)
        return
      }
      const filePath = dialogResult.filePaths[0]
      setFileName(filePath.split('\\').pop() || filePath.split('/').pop())

      const result = await window.api.file.read(filePath)
      if (!result.success || !result.data) {
        setError(t('import.importError'))
        setLoading(false)
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

      setColumns(preview.columns)
      setRows(preview.rows)
      setMapping(preview.suggestedMapping)

      const parsed = ImportService.applyMapping(preview.rows, preview.suggestedMapping)
      setImported(parsed)

      const existing = dataset?.transactions ?? []
      const dupFlags = ImportService.detectDuplicates(existing, parsed)
      setDuplicates(dupFlags)

      const skipped = new Set<number>()
      dupFlags.forEach((isDup, i) => { if (isDup) skipped.add(i) })
      setSkipIndices(skipped)

      const baseName = (filePath.split('\\').pop() || filePath.split('/').pop() || '').replace(/\.csv$/i, '')
      setConfigBaseName(baseName)
      const configResult = await window.api.config.readConfigForImport(baseName)
      if (configResult.success && configResult.categories) {
        const existingCatNames = new Set(dataset?.categories.map((c) => c.name.toLowerCase()) ?? [])
        for (const cat of configResult.categories) {
          if (!existingCatNames.has(cat.name.toLowerCase())) {
            addCategory(cat.name, cat.color, cat.icon)
          }
        }
      }
      if (configResult.success && configResult.receivables) {
        const currentCats = useAppStore.getState().dataset?.categories ?? []
        const existingRecTitles = new Set(
          (dataset?.receivables ?? []).map((r) => r.title.toLowerCase())
        )
        for (const rec of configResult.receivables) {
          if (!existingRecTitles.has(rec.title.toLowerCase())) {
            const matchedCat = currentCats.find(
              (c) => c.name.toLowerCase() === rec.category.toLowerCase()
            )
            addReceivable({
              title: rec.title,
              categoryId: matchedCat?.id ?? currentCats[0]?.id ?? '',
              totalAmount: rec.totalAmount,
              from: rec.from,
              notes: rec.notes
            })
          }
        }
      }
    } catch (err) {
      setError(t('import.importError') + ': ' + String(err))
    }
    setLoading(false)
  }

  const handleMappingChange = (newMapping: ColumnMappingType[]): void => {
    setMapping(newMapping)
    const parsed = ImportService.applyMapping(rows, newMapping)
    setImported(parsed)

    const existing = dataset?.transactions ?? []
    const dupFlags = ImportService.detectDuplicates(existing, parsed)
    setDuplicates(dupFlags)

    const skipped = new Set<number>()
    dupFlags.forEach((isDup, i) => { if (isDup) skipped.add(i) })
    setSkipIndices(skipped)
  }

  const handleDuplicateToggle = (index: number): void => {
    setSkipIndices((prev) => {
      const next = new Set(prev)
      if (next.has(index)) next.delete(index)
      else next.add(index)
      return next
    })
  }

  const handleConfirmImport = (): void => {
    try {
      const existingNames = new Set(dataset?.categories.map((c) => c.name.toLowerCase()) ?? [])
      const importedNames = new Set(imported.map((r) => r.category.toLowerCase()).filter(Boolean))
      const missingNames = [...importedNames].filter((name) => !existingNames.has(name))
      missingNames.forEach((name) => addCategory(name, '#808080', '📁'))

      const currentCategories = useAppStore.getState().dataset?.categories ?? []
      let count = 0
      imported.forEach((row, i) => {
        if (!skipIndices.has(i)) {
          const category = currentCategories.find(
            (c) => c.name.toLowerCase() === row.category.toLowerCase()
          )
          addTransaction({
            date: row.date,
            title: row.title,
            categoryId: category?.id ?? currentCategories[currentCategories.length - 1]?.id ?? '',
            type: row.type,
            amount: row.amount,
            notes: row.notes
          })
          count++
        }
      })
      setShowConfirm(false)
      setRows([])
      setImported([])
      setFileName(undefined)
      setError(null)
      addToast('success', t('import.importSuccess', { count }))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Import failed')
    }
  }

  const hasData = rows.length > 0

  return (
    <motion.div style={styles.container}>
      <h2 style={styles.title}>{t('import.title')}</h2>

      <FileSelector onSelect={handleSelectFile} fileName={fileName} />

      {loading && <p style={styles.loading}>{t('common.loading')}</p>}
      {error && <p style={styles.error}>{error}</p>}

      {hasData && (
        <>
          <ImportPreview columns={columns} rows={rows} />
          <ColumnMapping mapping={mapping} onChange={handleMappingChange} />
          <DuplicateReview
            imported={imported}
            duplicates={duplicates}
            onToggle={handleDuplicateToggle}
            currency={currency}
            locale={locale}
          />
          <div style={styles.actions}>
            <motion.button
              style={styles.importBtn}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setShowConfirm(true)}
            >
              {t('import.confirmImport', { count: imported.length - skipIndices.size })}
            </motion.button>
          </div>
        </>
      )}

      {showConfirm && (
        <ImportConfirmDialog
          totalRows={imported.length}
          skippedRows={skipIndices.size}
          imported={imported}
          onConfirm={handleConfirmImport}
          onCancel={() => setShowConfirm(false)}
        />
      )}
    </motion.div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  container: { padding: padding.page },
  title: { fontSize: fontSize.xxl, fontWeight: fontWeight.semibold, margin: `0 0 ${spacing.lg}`, color: colors.text.primary },
  loading: { color: colors.text.disabled, fontSize: fontSize.base },
  error: { color: colors.text.expense, fontSize: fontSize.base, padding: padding.input, backgroundColor: colors.bg.expense, borderRadius: borderRadius.md },
  actions: { marginTop: spacing.lg },
  importBtn: {
    padding: padding.buttonLg,
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    color: colors.text.inverse,
    backgroundColor: colors.success,
    border: 'none',
    borderRadius: borderRadius.md,
    cursor: 'pointer',
  },
}

export default ImportPage
