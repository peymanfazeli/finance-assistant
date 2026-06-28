import { useState } from 'react'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { useAppStore } from '../../core/store/useAppStore'
import { Category } from '../../core/models/types'
import { colors, spacing, fontSize, fontWeight, borderRadius, padding } from '../../core/utils/styles'
import { addToast } from '../components/ToastContainer'
import CategoryList from '../components/CategoryList'
import CategoryFormDialog from '../components/CategoryFormDialog'
import CategoryDeleteDialog from '../components/CategoryDeleteDialog'

function CategoryPage(): JSX.Element {
  const { t } = useTranslation()
  const { dataset, addCategory, updateCategory, deleteCategory } = useAppStore()
  const [showForm, setShowForm] = useState(false)
  const [editCategory, setEditCategory] = useState<Category | undefined>()
  const [deleteCategoryState, setDeleteCategoryState] = useState<Category | null>(null)

  const categories = dataset?.categories ?? []

  const handleSave = (name: string, color: string, icon: string): void => {
    if (editCategory) {
      updateCategory(editCategory.id, { name, color, icon })
      addToast('success', t('category.updated'))
    } else {
      addCategory(name, color, icon)
      addToast('success', t('category.created'))
    }
    setShowForm(false)
    setEditCategory(undefined)
  }

  const handleDelete = (reassignToId: string): void => {
    if (deleteCategoryState) {
      deleteCategory(deleteCategoryState.id, reassignToId)
      addToast('success', t('category.deleted'))
      setDeleteCategoryState(null)
    }
  }

  return (
    <motion.div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>{t('categories.title')}</h2>
        <motion.button
          style={styles.addBtn}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => { setEditCategory(undefined); setShowForm(true) }}
        >
          {t('categories.add')}
        </motion.button>
      </div>

      <CategoryList
        categories={categories}
        onEdit={(cat) => { setEditCategory(cat); setShowForm(true) }}
        onDelete={(cat) => setDeleteCategoryState(cat)}
      />

      <CategoryFormDialog
        open={showForm}
        category={editCategory}
        onSave={handleSave}
        onClose={() => { setShowForm(false); setEditCategory(undefined) }}
      />

      {deleteCategoryState && (
        <CategoryDeleteDialog
          open={true}
          category={deleteCategoryState}
          categories={categories}
          onConfirm={handleDelete}
          onClose={() => setDeleteCategoryState(null)}
        />
      )}
    </motion.div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  container: { padding: padding.page },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.lg },
  title: { fontSize: fontSize.xxl, fontWeight: fontWeight.semibold, margin: 0, color: colors.text.primary },
  addBtn: { padding: padding.button, fontSize: fontSize.base, fontWeight: fontWeight.semibold, color: colors.text.inverse, backgroundColor: colors.primary, border: 'none', borderRadius: borderRadius.md, cursor: 'pointer' },
}

export default CategoryPage
