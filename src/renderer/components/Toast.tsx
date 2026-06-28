import { motion } from 'framer-motion'
import { colors, borderRadius, spacing, fontSize, shadow, zIndex } from '../../core/utils/styles'

export type ToastType = 'success' | 'error' | 'info'

export interface ToastData {
  id: string
  type: ToastType
  message: string
}

interface ToastProps {
  toast: ToastData
  onDismiss: (id: string) => void
}

const typeStyles: Record<ToastType, React.CSSProperties> = {
  success: {
    backgroundColor: colors.bg.income,
    color: colors.text.income,
    borderLeft: `4px solid ${colors.success}`,
  },
  error: {
    backgroundColor: colors.bg.expense,
    color: colors.text.expense,
    borderLeft: `4px solid ${colors.danger}`,
  },
  info: {
    backgroundColor: colors.bg.active,
    color: colors.primary,
    borderLeft: `4px solid ${colors.primary}`,
  },
}

export default function Toast({ toast, onDismiss }: ToastProps) {
  return (
    <motion.div
      style={{ ...styles.container, ...typeStyles[toast.type] }}
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.95, transition: { duration: 0.15 } }}
      layout
    >
      <span style={styles.message}>{toast.message}</span>
      <button style={styles.dismissBtn} onClick={() => onDismiss(toast.id)} aria-label="Dismiss">
        ✕
      </button>
    </motion.div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    padding: `${spacing.md} ${spacing.lg}`,
    borderRadius: borderRadius.md,
    fontSize: fontSize.base,
    boxShadow: shadow.dropdown,
    minWidth: '280px',
    maxWidth: '420px',
    pointerEvents: 'auto',
  },
  message: {
    flex: 1,
    lineHeight: 1.4,
  },
  dismissBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: '14px',
    padding: '2px',
    opacity: 0.7,
    color: 'inherit',
    lineHeight: 1,
  },
}
