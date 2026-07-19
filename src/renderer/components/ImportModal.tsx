import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { ImportedRow, ColumnMapping as ColumnMappingType } from '../../core/services/ImportService'
import { colors, spacing, fontSize, fontWeight, borderRadius, padding, shadow, zIndex, borderWidth } from '../../core/utils/styles'
import Modal from './Modal'
import ImportPreview from './ImportPreview'
import ColumnMapping from './ColumnMapping'
import DuplicateReview from './DuplicateReview'

interface ImportModalProps {
  columns: string[]
  rows: Record<string, string>[]
  mapping: ColumnMappingType[]
  imported: ImportedRow[]
  duplicates: boolean[]
  skipIndices: Set<number>
  currency?: string
  locale?: string
  onMappingChange: (mapping: ColumnMappingType[]) => void
  onDuplicateToggle: (index: number) => void
  onConfirm: () => void
  onCancel: () => void
}

function ImportModal({
  columns,
  rows,
  mapping,
  imported,
  duplicates,
  skipIndices,
  currency = 'toman',
  locale = 'en-US',
  onMappingChange,
  onDuplicateToggle,
  onConfirm,
  onCancel
}: ImportModalProps): JSX.Element {
  const { t } = useTranslation()
  const importingCount = imported.length - skipIndices.size

  return (
    <Modal open={true} onClose={onCancel} title={t('import.confirmImport', { count: importingCount })}>
      <div style={styles.body}>
        <ImportPreview columns={columns} rows={rows} />
        <ColumnMapping mapping={mapping} onChange={onMappingChange} />
        <DuplicateReview
          imported={imported}
          duplicates={duplicates}
          onToggle={onDuplicateToggle}
          currency={currency}
          locale={locale}
        />
      </div>
      <div style={styles.buttons}>
        <motion.button
          style={styles.cancelBtn}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={onCancel}
        >
          {t('common.cancel')}
        </motion.button>
        <motion.button
          style={styles.confirmBtn}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={onConfirm}
        >
          {t('import.confirmImport', { count: importingCount })}
        </motion.button>
      </div>
    </Modal>
  )
}

const styles: Record<string, React.CSSProperties> = {
  body: {
    maxHeight: '60vh',
    overflowY: 'auto',
    marginBottom: spacing.xl,
  },
  buttons: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: spacing.sm,
  },
  cancelBtn: {
    padding: padding.button,
    fontSize: fontSize.md,
    color: colors.text.subtle,
    backgroundColor: colors.bg.hover,
    border: 'none',
    borderRadius: borderRadius.md,
    cursor: 'pointer',
  },
  confirmBtn: {
    padding: padding.button,
    fontSize: fontSize.md,
    color: colors.text.inverse,
    backgroundColor: colors.primary,
    border: 'none',
    borderRadius: borderRadius.md,
    cursor: 'pointer',
  },
}

export default ImportModal
