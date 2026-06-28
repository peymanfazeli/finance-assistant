import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAppStore } from '../../core/store/useAppStore'
import { Category } from '../../core/models/types'
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
    } else {
      addCategory(name, color, icon)
    }
    setShowForm(false)
    setEditCategory(undefined)
  }

  const handleDelete = (reassignToId: string): void => {
    if (deleteCategoryState) {
      deleteCategory(deleteCategoryState.id, reassignToId)
      setDeleteCategoryState(null)
    }
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>{t('categories.title')}</h2>
        <button
          style={styles.addBtn}
          onClick={() => { setEditCategory(undefined); setShowForm(true) }}
        >
          {t('categories.add')}
        </button>
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
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  container: { padding: '24px' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' },
  title: { fontSize: '20px', fontWeight: 600, margin: 0, color: '#1a1a1a' },
  addBtn: { padding: '8px 16px', fontSize: '14px', fontWeight: 600, color: '#fff', backgroundColor: '#4A90D9', border: 'none', borderRadius: '6px', cursor: 'pointer' }
}

export default CategoryPage
