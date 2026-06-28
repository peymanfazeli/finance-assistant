import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Category } from '../../core/models/types'

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

  if (!open) return null

  return (
    <div style={styles.overlay}>
      <div style={styles.dialog}>
        <h3 style={styles.title}>{category ? t('categories.edit') : t('categories.add')}</h3>
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
              <button
                key={c}
                style={{
                  ...styles.colorBtn,
                  backgroundColor: c,
                  outline: color === c ? '3px solid #333' : 'none',
                  outlineOffset: '2px'
                }}
                onClick={() => setColor(c)}
              />
            ))}
          </div>
        </div>
        <div style={styles.buttons}>
          <button style={styles.cancelBtn} onClick={onClose}>{t('common.cancel')}</button>
          <button
            style={styles.saveBtn}
            onClick={() => { if (name.trim()) { onSave(name.trim(), color, 'category'); onClose() } }}
            disabled={!name.trim()}
          >
            {t('common.save')}
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
  title: { fontSize: '18px', fontWeight: 600, margin: '0 0 16px', color: '#1a1a1a' },
  field: { marginBottom: '14px' },
  label: { display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px', color: '#555' },
  input: { width: '100%', padding: '8px 10px', fontSize: '14px', border: '1px solid #ccc', borderRadius: '6px', boxSizing: 'border-box' },
  colors: { display: 'flex', flexWrap: 'wrap', gap: '6px' },
  colorBtn: { width: '28px', height: '28px', borderRadius: '50%', border: 'none', cursor: 'pointer' },
  buttons: { display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '16px' },
  cancelBtn: { padding: '8px 16px', fontSize: '13px', color: '#666', backgroundColor: '#f0f0f0', border: 'none', borderRadius: '6px', cursor: 'pointer' },
  saveBtn: { padding: '8px 16px', fontSize: '13px', color: '#fff', backgroundColor: '#4A90D9', border: 'none', borderRadius: '6px', cursor: 'pointer' }
}

export default CategoryFormDialog
