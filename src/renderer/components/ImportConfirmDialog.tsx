import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import { ImportedRow } from '../../core/services/ImportService'
import { colors, spacing, fontSize, fontWeight, borderRadius, padding } from '../../core/utils/styles'
import Modal from './Modal'

interface ImportConfirmDialogProps {
  totalRows: number
  skippedRows: number
  imported: ImportedRow[]
  onConfirm: () => void
  onCancel: () => void
}

function ImportConfirmDialog({
  totalRows,
  skippedRows,
  onConfirm,
  onCancel
}: ImportConfirmDialogProps): JSX.Element {
  const { t } = useTranslation()
  const importing = totalRows - skippedRows

  return (
    <Modal open={true} onClose={onCancel} title={t('import.confirmImport', { count: importing })}>
      <p style={styles.info}>
        {importing} of {totalRows} rows will be imported
        {skippedRows > 0 && ` (${skippedRows} skipped as duplicates)`}
      </p>
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
          {t('common.confirm')}
        </motion.button>
      </div>
    </Modal>
  )
}

const styles: Record<string, React.CSSProperties> = {
  info: { fontSize: fontSize.base, color: colors.text.subtle, margin: `0 0 ${spacing.xl}` },
  buttons: { display: 'flex', justifyContent: 'flex-end', gap: spacing.sm },
  cancelBtn: { padding: padding.button, fontSize: fontSize.md, color: colors.text.subtle, backgroundColor: colors.bg.hover, border: 'none', borderRadius: borderRadius.md, cursor: 'pointer' },
  confirmBtn: { padding: padding.button, fontSize: fontSize.md, color: colors.text.inverse, backgroundColor: colors.primary, border: 'none', borderRadius: borderRadius.md, cursor: 'pointer' },
}

export default ImportConfirmDialog
