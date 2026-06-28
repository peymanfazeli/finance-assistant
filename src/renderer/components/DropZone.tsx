import React, { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { colors, spacing, fontSize, fontWeight, borderRadius, shadow, zIndex, borderWidth, padding } from '../../core/utils/styles'
import { addToast } from './ToastContainer'

interface DropZoneProps {
  onFileDrop: (filePath: string) => void
  children: React.ReactNode
}

const VALID_EXTENSIONS = ['.csv', '.xlsx']

function DropZone({ onFileDrop, children }: DropZoneProps): JSX.Element {
  const { t } = useTranslation()
  const [dragging, setDragging] = useState(false)

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragging(true)
  }, [])

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragging(false)
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setDragging(false)

      const files = Array.from(e.dataTransfer.files)
      if (files.length === 0) return

      if (files.length > 1) {
        addToast('error', t('import.singleFileOnly'))
        return
      }

      const file = files[0]
      const ext = '.' + file.name.split('.').pop()?.toLowerCase()
      if (!VALID_EXTENSIONS.includes(ext)) {
        addToast('error', t('import.invalidFileType', { types: 'CSV, XLSX' }))
        return
      }

      onFileDrop((file as any).path ?? file.name)
    },
    [onFileDrop, t]
  )

  return (
    <div
      style={styles.wrapper}
      onDragOver={handleDragOver}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {children}
      <AnimatePresence>
        {dragging && (
          <motion.div
            style={styles.overlay}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            <motion.div
              style={styles.dropBox}
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
            >
              <span style={styles.dropIcon}>📁</span>
              <span style={styles.dropText}>{t('import.dropHere')}</span>
              <span style={styles.dropHint}>CSV, XLSX</span>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  wrapper: { position: 'relative', minHeight: '200px' },
  overlay: {
    position: 'absolute',
    inset: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bg.overlay,
    borderRadius: borderRadius.lg,
    zIndex: zIndex.modal,
  },
  dropBox: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: spacing.md,
    padding: padding.dialogLg,
    backgroundColor: colors.bg.card,
    borderRadius: borderRadius.xl,
    border: `${borderWidth.thick} dashed ${colors.primary}`,
    boxShadow: shadow.modal,
  },
  dropIcon: { fontSize: '48px' },
  dropText: { fontSize: fontSize.lg, fontWeight: fontWeight.semibold, color: colors.primary },
  dropHint: { fontSize: fontSize.md, color: colors.text.disabled },
}

export default DropZone
