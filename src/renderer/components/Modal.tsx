import React, { useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { colors, gradients, borderRadius, fontSize, fontWeight, shadow, zIndex, spacing, padding, borderWidth, sizes } from '../../core/utils/styles'

interface ModalProps {
  open: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
  width?: string
  footer?: React.ReactNode
}

const overlayVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
}

const modalVariants = {
  hidden: { opacity: 0, y: 30, scale: 0.97 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: 'spring', damping: 25, stiffness: 350 },
  },
  exit: { opacity: 0, y: 20, scale: 0.97, transition: { duration: 0.15 } },
}

export default function Modal({ open, onClose, title, children, width = sizes.dialogLg, footer }: ModalProps) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    },
    [onClose]
  )

  useEffect(() => {
    if (open) {
      document.addEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [open, handleKeyDown])

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          style={styles.overlay}
          variants={overlayVariants}
          initial="hidden"
          animate="visible"
          exit="hidden"
          onClick={onClose}
        >
          <motion.div
            style={{ ...styles.dialog, maxWidth: width }}
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label={title}
          >
            {title && (
              <div data-modal-header style={styles.header}>
                <h2 style={styles.title}>{title}</h2>
                <button type="button" style={styles.closeBtn} onClick={onClose} aria-label="Close">
                  ✕
                </button>
              </div>
            )}
            <div data-modal-body style={styles.body}>{children}</div>
            {footer && <div data-modal-footer style={styles.footer}>{footer}</div>}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'fixed',
    inset: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bg.overlay,
    backdropFilter: 'blur(4px)',
    zIndex: zIndex.modal,
    padding: spacing.xl,
  },
  dialog: {
    width: '100%',
    maxHeight: '100%',
    display: 'flex',
    flexDirection: 'column',
    minHeight: 0,
    backgroundColor: colors.bg.elevated,
    backgroundImage: gradients.surface,
    border: `${borderWidth.default} solid ${colors.border.strong}`,
    borderRadius: borderRadius.xxl,
    boxShadow: shadow.modal,
    overflow: 'hidden',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexShrink: 0,
    padding: `${spacing.lg} ${spacing.xl}`,
    backgroundColor: colors.bg.surface,
    borderBottom: `${borderWidth.default} solid ${colors.border.default}`,
  },
  title: {
    margin: 0,
    fontSize: fontSize.xl,
    fontWeight: fontWeight.semibold,
    color: colors.text.primary,
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    fontSize: fontSize.lg,
    cursor: 'pointer',
    color: colors.text.muted,
    padding: spacing.xs,
    lineHeight: 1,
    borderRadius: borderRadius.sm,
  },
  body: {
    flex: 1,
    minHeight: 0,
    overflowY: 'auto',
    overflowX: 'hidden',
    overscrollBehavior: 'contain',
    padding: padding.dialog,
  },
  footer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: spacing.sm,
    flexShrink: 0,
    padding: `${spacing.md} ${spacing.xl}`,
    backgroundColor: colors.bg.surface,
    borderTop: `${borderWidth.default} solid ${colors.border.default}`,
  },
}
