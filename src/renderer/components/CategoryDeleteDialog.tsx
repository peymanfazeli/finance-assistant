import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import { Category } from '../../core/models/types'
import { colors, spacing, fontSize, fontWeight, borderRadius, padding, borderWidth } from '../../core/utils/styles'
import Modal from './Modal'

interface CategoryDeleteDialogProps {
  open: boolean
  category: Category
  categories: Category[]
  onConfirm: (reassignToId: string) => void
  onClose: () => void
}

function CategoryDeleteDialog({ open, category, categories, onConfirm, onClose }: CategoryDeleteDialogProps): JSX.Element | null {
  const { t } = useTranslation()
  const others = categories.filter((c) => c.id !== category.id)
  const [reassignToId, setReassignToId] = useState(others[0]?.id ?? '')

  return (
    <Modal open={open} onClose={onClose} title={t('categories.confirmDelete')}>
      <p style={styles.info}>
        &ldquo;{category.name}&rdquo; {t('categories.reassignTo')}:
      </p>
      <select
        style={styles.select}
        value={reassignToId}
        onChange={(e) => setReassignToId(e.target.value)}
      >
        {others.map((c) => (
          <option key={c.id} value={c.id}>{c.name}</option>
        ))}
      </select>
      <div style={styles.buttons}>
        <motion.button
          style={styles.cancelBtn}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={onClose}
        >
          {t('common.cancel')}
        </motion.button>
        <motion.button
          style={styles.deleteBtn}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => onConfirm(reassignToId)}
        >
          {t('common.delete')}
        </motion.button>
      </div>
    </Modal>
  )
}

const styles: Record<string, React.CSSProperties> = {
  info: { fontSize: fontSize.base, color: colors.text.subtle, margin: `0 0 ${spacing.md}` },
  select: { width: '100%', padding: padding.input, fontSize: fontSize.base, border: `${borderWidth.default} solid ${colors.border.input}`, borderRadius: borderRadius.md, backgroundColor: colors.bg.input, boxSizing: 'border-box' },
  buttons: { display: 'flex', justifyContent: 'flex-end', gap: spacing.sm, marginTop: spacing.lg },
  cancelBtn: { padding: padding.button, fontSize: fontSize.md, color: colors.text.subtle, backgroundColor: colors.bg.hover, border: 'none', borderRadius: borderRadius.md, cursor: 'pointer' },
  deleteBtn: { padding: padding.button, fontSize: fontSize.md, color: colors.text.inverse, backgroundColor: colors.danger, border: 'none', borderRadius: borderRadius.md, cursor: 'pointer' },
}

export default CategoryDeleteDialog
