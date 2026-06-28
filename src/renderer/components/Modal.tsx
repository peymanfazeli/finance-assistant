import React, { useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { colors, borderRadius, shadow, zIndex, spacing, padding, borderWidth, sizes } from '../../core/utils/styles'

interface ModalProps {
  open: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
  width?: string
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

export default function Modal({ open, onClose, title, children, width = sizes.dialogLg }: ModalProps) {
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
              <div style={styles.header}>
                <h2 style={styles.title}>{title}</h2>
                <button style={styles.closeBtn} onClick={onClose} aria-label="Close">
                  ✕
                </button>
              </div>
            )}
            <div style={styles.body}>{children}</div>
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
    zIndex: zIndex.modal,
    padding: spacing.xxl,
  },
  dialog: {
    width: '100%',
    backgroundColor: colors.bg.card,
    borderRadius: borderRadius.xxl,
    boxShadow: shadow.modal,
    overflow: 'hidden',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: `${spacing.xl} ${spacing.xxl}`,
    borderBottom: `${borderWidth.default} solid ${colors.border.light}`,
  },
  title: {
    margin: 0,
    fontSize: '18px',
    fontWeight: 600,
    color: colors.text.primary,
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    fontSize: '18px',
    cursor: 'pointer',
    color: colors.text.disabled,
    padding: spacing.xs,
    lineHeight: 1,
  },
  body: {
    padding: padding.dialog,
  },
}
