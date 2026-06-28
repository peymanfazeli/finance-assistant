import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { Category } from '../../core/models/types'
import { colors, spacing, fontSize, fontWeight, borderRadius, padding, shadow, borderWidth } from '../../core/utils/styles'
import useReducedMotion from '../hooks/useReducedMotion'

interface CategoryListProps {
  categories: Category[]
  onEdit: (category: Category) => void
  onDelete: (category: Category) => void
}

const cardVariants = {
  hidden: { opacity: 0, y: 8 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.04, duration: 0.2, ease: 'easeOut' },
  }),
}

const listVariants = {
  visible: { transition: { staggerChildren: 0.04 } },
}

function CategoryList({ categories, onEdit, onDelete }: CategoryListProps): JSX.Element {
  const { t } = useTranslation()
  const prefersReduced = useReducedMotion()

  return (
    <motion.div
      style={styles.grid}
      variants={prefersReduced ? undefined : listVariants}
      initial="hidden"
      animate="visible"
    >
      {categories.map((cat, i) => (
        <motion.div
          key={cat.id}
          style={styles.card}
          variants={prefersReduced ? undefined : cardVariants}
          custom={i}
          initial="hidden"
          animate="visible"
          whileHover={prefersReduced ? {} : { y: -2, boxShadow: shadow.elevated }}
        >
          <div style={{ ...styles.colorDot, backgroundColor: cat.color }} />
          <div style={styles.info}>
            <span style={styles.name}>{cat.name}</span>
            <span style={styles.badge}>
              {cat.isDefault ? 'Default' : t('categories.edit')}
            </span>
          </div>
          {!cat.isDefault && (
            <div style={styles.actions}>
              <motion.button
                style={styles.editBtn}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => onEdit(cat)}
              >
                {t('common.edit')}
              </motion.button>
              <motion.button
                style={styles.deleteBtn}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => onDelete(cat)}
              >
                {t('common.delete')}
              </motion.button>
            </div>
          )}
        </motion.div>
      ))}
    </motion.div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: spacing.md },
  card: {
    display: 'flex',
    alignItems: 'center',
    gap: spacing.md,
    padding: '14px',
    backgroundColor: colors.bg.card,
    borderRadius: borderRadius.lg,
    border: `${borderWidth.default} solid ${colors.border.light}`,
    boxShadow: shadow.card,
    transition: 'box-shadow 0.15s',
  },
  colorDot: { width: '20px', height: '20px', borderRadius: borderRadius.full, flexShrink: 0 },
  info: { flex: 1 },
  name: { display: 'block', fontSize: fontSize.base, fontWeight: fontWeight.semibold, color: colors.text.primary },
  badge: { fontSize: fontSize.xs, color: colors.text.disabled },
  actions: { display: 'flex', gap: spacing.xs },
  editBtn: {
    padding: '4px 10px',
    fontSize: fontSize.sm,
    color: colors.primary,
    backgroundColor: colors.bg.active,
    border: 'none',
    borderRadius: borderRadius.sm,
    cursor: 'pointer',
  },
  deleteBtn: {
    padding: '4px 10px',
    fontSize: fontSize.sm,
    color: colors.danger,
    backgroundColor: colors.bg.expense,
    border: 'none',
    borderRadius: borderRadius.sm,
    cursor: 'pointer',
  },
}

export default CategoryList
