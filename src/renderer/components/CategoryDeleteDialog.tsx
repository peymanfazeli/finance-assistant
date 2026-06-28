import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Category } from '../../core/models/types'

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

  if (!open) return null

  return (
    <div style={styles.overlay}>
      <div style={styles.dialog}>
        <h3 style={styles.title}>{t('categories.confirmDelete')}</h3>
        <p style={styles.info}>
          "{category.name}" {t('categories.reassignTo')}:
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
          <button style={styles.cancelBtn} onClick={onClose}>{t('common.cancel')}</button>
          <button style={styles.deleteBtn} onClick={() => onConfirm(reassignToId)}>
            {t('common.delete')}
          </button>
        </div>
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000
  },
  dialog: { backgroundColor: '#fff', borderRadius: '12px', padding: '24px', width: '360px', boxShadow: '0 4px 24px rgba(0,0,0,0.15)' },
  title: { fontSize: '18px', fontWeight: 600, margin: '0 0 8px', color: '#1a1a1a' },
  info: { fontSize: '14px', color: '#666', margin: '0 0 12px' },
  select: {
    width: '100%',
    padding: '8px 10px',
    fontSize: '14px',
    border: '1px solid #ccc',
    borderRadius: '6px',
    backgroundColor: '#fff',
    boxSizing: 'border-box'
  },
  buttons: { display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '16px' },
  cancelBtn: { padding: '8px 16px', fontSize: '13px', color: '#666', backgroundColor: '#f0f0f0', border: 'none', borderRadius: '6px', cursor: 'pointer' },
  deleteBtn: { padding: '8px 16px', fontSize: '13px', color: '#fff', backgroundColor: '#dc3545', border: 'none', borderRadius: '6px', cursor: 'pointer' }
}

export default CategoryDeleteDialog
