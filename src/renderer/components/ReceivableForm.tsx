import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Receivable, Category } from '../../core/models/types'
import Modal from './Modal'

interface ReceivableFormProps {
  receivable?: Receivable
  categories: Category[]
  onSave: (data: {
    title: string
    categoryId: string
    totalAmount: number
    from: string
    notes: string
    askDate?: string
  }) => void
  onCancel: () => void
}

function ReceivableForm({ receivable, categories, onSave, onCancel }: ReceivableFormProps): JSX.Element {
  const { t } = useTranslation()
  const [title, setTitle] = useState(receivable?.title ?? '')
  const [categoryId, setCategoryId] = useState(receivable?.categoryId ?? categories[0]?.id ?? '')
  const [totalAmount, setTotalAmount] = useState(receivable?.totalAmount?.toString() ?? '')
  const [from, setFrom] = useState(receivable?.from ?? '')
  const [notes, setNotes] = useState(receivable?.notes ?? '')
  const [askDate, setAskDate] = useState(receivable?.askDate ?? '')
  const [showValidationModal, setShowValidationModal] = useState(false)
  const [missingFields, setMissingFields] = useState<string[]>([])

  const handleSubmit = (): void => {
    const parsedAmount = parseFloat(totalAmount)
    const fields: string[] = []
    if (!title.trim()) fields.push(t('receivable.titleLabel'))
    if (!categoryId) fields.push(t('receivable.category'))
    if (!totalAmount || isNaN(parsedAmount) || parsedAmount <= 0) fields.push(t('receivable.totalAmount'))
    if (!from.trim()) fields.push(t('receivable.from'))
    if (fields.length > 0) {
      setMissingFields(fields)
      setShowValidationModal(true)
      return
    }
    try {
      onSave({ title: title.trim(), categoryId, totalAmount: parsedAmount, from: from.trim(), notes, askDate: askDate || undefined })
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Save failed')
    }
  }

  return (
    <div style={styles.form}>
      <div style={styles.field}>
        <label style={styles.label}>{t('receivable.titleLabel')}</label>
        <input
          style={styles.input}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={t('receivable.titlePlaceholder')}
        />
      </div>
      <div style={styles.field}>
        <label style={styles.label}>{t('receivable.category')}</label>
        <select style={styles.select} value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>
      <div style={styles.field}>
        <label style={styles.label}>{t('receivable.from')}</label>
        <input
          style={styles.input}
          value={from}
          onChange={(e) => setFrom(e.target.value)}
          placeholder={t('receivable.fromPlaceholder')}
        />
      </div>
      <div style={styles.field}>
        <label style={styles.label}>{t('receivable.totalAmount')}</label>
        <input
          style={styles.input}
          type="number"
          step="0.01"
          min="0"
          value={totalAmount}
          onChange={(e) => setTotalAmount(e.target.value)}
        />
      </div>
      <div style={styles.field}>
        <label style={styles.label}>{t('receivable.askDate')}</label>
        <input
          style={styles.input}
          type="date"
          value={askDate}
          onChange={(e) => setAskDate(e.target.value)}
        />
      </div>
      <div style={styles.field}>
        <label style={styles.label}>{t('receivable.notes')}</label>
        <textarea
          style={styles.textarea}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder={t('receivable.notesPlaceholder')}
        />
      </div>
      <div style={styles.buttons}>
        <button style={styles.cancelBtn} onClick={onCancel}>{t('common.cancel')}</button>
        <button style={styles.saveBtn} onClick={handleSubmit}>{t('common.save')}</button>
      </div>
      <Modal
        open={showValidationModal}
        onClose={() => setShowValidationModal(false)}
        title={t('receivable.validationTitle')}
      >
        <p>{t('receivable.validationMessage')}</p>
        <ul>
          {missingFields.map((field) => (
            <li key={field}>{field}</li>
          ))}
        </ul>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
          <button
            onClick={() => setShowValidationModal(false)}
            style={{
              padding: '8px 16px',
              fontSize: '13px',
              color: '#fff',
              backgroundColor: '#4A90D9',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer'
            }}
          >
            {t('common.ok')}
          </button>
        </div>
      </Modal>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  form: { padding: 0 },
  field: { marginBottom: '12px' },
  label: { display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '4px', color: '#555' },
  input: {
    width: '100%',
    padding: '8px 10px',
    fontSize: '14px',
    border: '1px solid #ccc',
    borderRadius: '6px',
    boxSizing: 'border-box'
  },
  select: {
    width: '100%',
    padding: '8px 10px',
    fontSize: '14px',
    border: '1px solid #ccc',
    borderRadius: '6px',
    backgroundColor: '#fff',
    boxSizing: 'border-box'
  },
  textarea: {
    width: '100%',
    padding: '8px 10px',
    fontSize: '14px',
    border: '1px solid #ccc',
    borderRadius: '6px',
    minHeight: '60px',
    resize: 'vertical',
    boxSizing: 'border-box'
  },
  buttons: { display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '16px' },
  cancelBtn: {
    padding: '8px 16px',
    fontSize: '13px',
    color: '#666',
    backgroundColor: '#f0f0f0',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer'
  },
  saveBtn: {
    padding: '8px 16px',
    fontSize: '13px',
    color: '#fff',
    backgroundColor: '#4A90D9',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer'
  }
}

export default ReceivableForm
