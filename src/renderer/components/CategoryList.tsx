import { useTranslation } from 'react-i18next'
import { Category } from '../../core/models/types'

interface CategoryListProps {
  categories: Category[]
  onEdit: (category: Category) => void
  onDelete: (category: Category) => void
}

function CategoryList({ categories, onEdit, onDelete }: CategoryListProps): JSX.Element {
  const { t } = useTranslation()

  return (
    <div style={styles.grid}>
      {categories.map((cat) => (
        <div key={cat.id} style={styles.card}>
          <div style={{ ...styles.colorDot, backgroundColor: cat.color }} />
          <div style={styles.info}>
            <span style={styles.name}>{cat.name}</span>
            <span style={styles.badge}>
              {cat.isDefault ? 'Default' : t('categories.edit')}
            </span>
          </div>
          {!cat.isDefault && (
            <div style={styles.actions}>
              <button style={styles.editBtn} onClick={() => onEdit(cat)}>
                {t('common.edit')}
              </button>
              <button style={styles.deleteBtn} onClick={() => onDelete(cat)}>
                {t('common.delete')}
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px' },
  card: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '14px',
    backgroundColor: '#fff',
    borderRadius: '8px',
    border: '1px solid #f0f0f0',
    boxShadow: '0 1px 4px rgba(0,0,0,0.05)'
  },
  colorDot: { width: '20px', height: '20px', borderRadius: '50%', flexShrink: 0 },
  info: { flex: 1 },
  name: { display: 'block', fontSize: '14px', fontWeight: 600, color: '#1a1a1a' },
  badge: { fontSize: '11px', color: '#888' },
  actions: { display: 'flex', gap: '4px' },
  editBtn: {
    padding: '4px 10px',
    fontSize: '12px',
    color: '#4A90D9',
    backgroundColor: '#e8f0fe',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer'
  },
  deleteBtn: {
    padding: '4px 10px',
    fontSize: '12px',
    color: '#dc3545',
    backgroundColor: '#f8d7da',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer'
  }
}

export default CategoryList
