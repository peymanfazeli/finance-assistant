import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import { Category } from '../../core/models/types'
import { colors, spacing, fontSize, fontWeight, borderRadius, padding, borderWidth } from '../../core/utils/styles'
import Modal from './Modal'

const COLORS = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F', '#BDC3C7', '#E67E22', '#2ECC71', '#3498DB']

interface CategoryFormDialogProps {
  open: boolean
  category?: Category
  onSave: (name: string, color: string, icon: string) => void
  onClose: () => void
}

function CategoryFormDialog({ open, category, onSave, onClose }: CategoryFormDialogProps): JSX.Element | null {
  const { t } = useTranslation()
  const [name, setName] = useState('')
  const [color, setColor] = useState(COLORS[0])

  useEffect(() => {
    if (category) {
      setName(category.name)
      setColor(category.color)
    } else {
      setName('')
      setColor(COLORS[0])
    }
  }, [category, open])

  return (
    <Modal open={open} onClose={onClose} title={category ? t('categories.edit') : t('categories.add')}>
      <div style={styles.field}>
        <label style={styles.label}>{t('categories.name')}</label>
        <input
          style={styles.input}
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoFocus
        />
      </div>
      <div style={styles.field}>
        <label style={styles.label}>{t('categories.color')}</label>
        <div style={styles.colors}>
          {COLORS.map((c) => (
            <motion.button
              key={c}
              style={{
                ...styles.colorBtn,
                backgroundColor: c,
                outline: color === c ? `3px solid ${colors.text.primary}` : 'none',
                outlineOffset: '2px',
              }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setColor(c)}
            />
          ))}
        </div>
      </div>
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
          style={styles.saveBtn}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => { if (name.trim()) { onSave(name.trim(), color, 'category') } }}
          disabled={!name.trim()}
        >
          {t('common.save')}
        </motion.button>
      </div>
    </Modal>
  )
}

const styles: Record<string, React.CSSProperties> = {
  field: { marginBottom: spacing.lg },
  label: { display: 'block', fontSize: fontSize.md, fontWeight: fontWeight.medium, marginBottom: spacing.sm, color: colors.text.muted },
  input: { width: '100%', padding: padding.input, fontSize: fontSize.base, border: `${borderWidth.default} solid ${colors.border.input}`, borderRadius: borderRadius.md, boxSizing: 'border-box' },
  colors: { display: 'flex', flexWrap: 'wrap', gap: spacing.sm },
  colorBtn: { width: '28px', height: '28px', borderRadius: borderRadius.full, border: 'none', cursor: 'pointer' },
  buttons: { display: 'flex', justifyContent: 'flex-end', gap: spacing.sm, marginTop: spacing.lg },
  cancelBtn: { padding: padding.button, fontSize: fontSize.md, color: colors.text.subtle, backgroundColor: colors.bg.hover, border: 'none', borderRadius: borderRadius.md, cursor: 'pointer' },
  saveBtn: { padding: padding.button, fontSize: fontSize.md, color: colors.text.inverse, backgroundColor: colors.primary, border: 'none', borderRadius: borderRadius.md, cursor: 'pointer' },
}

export default CategoryFormDialog
