import { useState } from 'react'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { colors, spacing, fontSize, fontWeight, borderRadius, padding } from '../../core/utils/styles'
import Modal from './Modal'

interface ExportOnCloseDialogProps {
  onExport: () => Promise<void>
  onCloseAnyway: () => void
  onCancel: () => void
}

function ExportOnCloseDialog({ onExport, onCloseAnyway, onCancel }: ExportOnCloseDialogProps): JSX.Element {
  const { t } = useTranslation()
  const [exporting, setExporting] = useState(false)

  const handleExport = async (): Promise<void> => {
    setExporting(true)
    try {
      await onExport()
    } finally {
      setExporting(false)
    }
  }

  return (
    <Modal open={true} onClose={onCancel} title={t('exportOnClose.title')}>
      <p style={styles.info}>{t('exportOnClose.message')}</p>
      <div style={styles.buttons}>
        <motion.button
          style={styles.exportBtn}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={handleExport}
          disabled={exporting}
        >
          {exporting ? t('common.loading') : t('exportOnClose.exportNow')}
        </motion.button>
        <motion.button
          style={styles.closeBtn}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={onCloseAnyway}
        >
          {t('exportOnClose.closeAnyway')}
        </motion.button>
        <motion.button
          style={styles.cancelBtn}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={onCancel}
        >
          {t('common.cancel')}
        </motion.button>
      </div>
    </Modal>
  )
}

const styles: Record<string, React.CSSProperties> = {
  info: { fontSize: fontSize.base, color: colors.text.subtle, margin: `0 0 ${spacing.xl}`, lineHeight: 1.5 },
  buttons: { display: 'flex', gap: spacing.sm, justifyContent: 'flex-end', flexWrap: 'wrap' },
  exportBtn: { padding: padding.buttonLg, fontSize: fontSize.base, fontWeight: fontWeight.semibold, color: colors.text.inverse, backgroundColor: colors.primary, border: 'none', borderRadius: borderRadius.md, cursor: 'pointer' },
  closeBtn: { padding: padding.buttonLg, fontSize: fontSize.base, fontWeight: fontWeight.semibold, color: colors.text.income, backgroundColor: colors.bg.income, border: 'none', borderRadius: borderRadius.md, cursor: 'pointer' },
  cancelBtn: { padding: padding.buttonLg, fontSize: fontSize.base, fontWeight: fontWeight.semibold, color: colors.text.subtle, backgroundColor: colors.bg.hover, border: 'none', borderRadius: borderRadius.md, cursor: 'pointer' },
}

export default ExportOnCloseDialog
