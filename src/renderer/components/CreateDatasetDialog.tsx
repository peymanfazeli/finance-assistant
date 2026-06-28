import { useState } from 'react'
import { useTranslation } from 'react-i18next'

interface CreateDatasetDialogProps {
  open: boolean
  onClose: () => void
  onCreate: (name: string, currency: string) => void
}

const CURRENCIES = ['USD', 'EUR', 'GBP', 'IRR', 'CAD', 'AUD', 'JPY']

function CreateDatasetDialog({ open, onClose, onCreate }: CreateDatasetDialogProps): JSX.Element | null {
  const { t } = useTranslation()
  const [name, setName] = useState('')
  const [currency, setCurrency] = useState('USD')

  if (!open) return null

  const handleCreate = (): void => {
    if (!name.trim()) return
    onCreate(name.trim(), currency)
    setName('')
    setCurrency('USD')
  }

  return (
    <div style={styles.overlay}>
      <div style={styles.dialog}>
        <h2 style={styles.title}>{t('dataset.createTitle')}</h2>
        <div style={styles.field}>
          <label style={styles.label}>{t('dataset.name')}</label>
          <input
            style={styles.input}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t('dataset.namePlaceholder')}
            autoFocus
          />
        </div>
        <div style={styles.field}>
          <label style={styles.label}>{t('dataset.currency')}</label>
          <select
            style={styles.select}
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
          >
            {CURRENCIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
        <div style={styles.buttons}>
          <button style={styles.cancelButton} onClick={onClose}>
            {t('common.cancel')}
          </button>
          <button
            style={styles.createButton}
            onClick={handleCreate}
            disabled={!name.trim()}
          >
            {t('common.create')}
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
  dialog: {
    backgroundColor: '#fff',
    borderRadius: '12px',
    padding: '32px',
    width: '400px',
    maxWidth: '90vw',
    boxShadow: '0 4px 24px rgba(0,0,0,0.15)'
  },
  title: {
    fontSize: '20px',
    fontWeight: 600,
    margin: '0 0 24px',
    color: '#1a1a1a'
  },
  field: {
    marginBottom: '16px'
  },
  label: {
    display: 'block',
    fontSize: '14px',
    fontWeight: 500,
    marginBottom: '6px',
    color: '#444'
  },
  input: {
    width: '100%',
    padding: '10px 12px',
    fontSize: '14px',
    border: '1px solid #ccc',
    borderRadius: '6px',
    outline: 'none',
    boxSizing: 'border-box'
  },
  select: {
    width: '100%',
    padding: '10px 12px',
    fontSize: '14px',
    border: '1px solid #ccc',
    borderRadius: '6px',
    outline: 'none',
    backgroundColor: '#fff',
    boxSizing: 'border-box'
  },
  buttons: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '8px',
    marginTop: '24px'
  },
  cancelButton: {
    padding: '10px 20px',
    fontSize: '14px',
    color: '#666',
    backgroundColor: '#f0f0f0',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer'
  },
  createButton: {
    padding: '10px 20px',
    fontSize: '14px',
    color: '#fff',
    backgroundColor: '#4A90D9',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer'
  }
}

export default CreateDatasetDialog
