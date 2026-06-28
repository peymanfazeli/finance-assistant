import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAppStore } from '../../core/store/useAppStore'
import { ImportService, ColumnMapping as ColumnMappingType, ImportedRow } from '../../core/services/ImportService'
import FileSelector from '../components/FileSelector'
import ImportPreview from '../components/ImportPreview'
import ColumnMapping from '../components/ColumnMapping'
import DuplicateReview from '../components/DuplicateReview'
import ImportConfirmDialog from '../components/ImportConfirmDialog'

function ImportPage(): JSX.Element {
  const { t, i18n } = useTranslation()
  const { dataset, addTransaction } = useAppStore()
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
      imported.forEach((row, i) => {
        if (!skipIndices.has(i)) {
          const category = dataset?.categories.find(
            (c) => c.name.toLowerCase() === row.category.toLowerCase()
          )
          addTransaction({
            date: row.date,
            title: row.title,
            categoryId: category?.id ?? dataset?.categories[dataset.categories.length - 1]?.id ?? '',
            type: row.type,
            amount: row.amount,
            notes: row.notes
          })
        }
      })
      setShowConfirm(false)
      setRows([])
      setImported([])
      setFileName(undefined)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Import failed')
    }
  }

  const hasData = rows.length > 0

  return (
    <div style={styles.container}>
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
            <button style={styles.importBtn} onClick={() => setShowConfirm(true)}>
              {t('import.confirmImport', { count: imported.length - skipIndices.size })}
            </button>
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
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  container: { padding: '24px' },
  title: { fontSize: '20px', fontWeight: 600, margin: '0 0 16px', color: '#1a1a1a' },
  loading: { color: '#888', fontSize: '14px' },
  error: { color: '#721c24', fontSize: '14px', padding: '8px 12px', backgroundColor: '#f8d7da', borderRadius: '6px' },
  actions: { marginTop: '16px' },
  importBtn: {
    padding: '10px 24px',
    fontSize: '14px',
    fontWeight: 600,
    color: '#fff',
    backgroundColor: '#28a745',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer'
  }
}

export default ImportPage
