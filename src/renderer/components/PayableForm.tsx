import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Payable, Category } from '../../core/models/types'
import Modal from './Modal'
import PersianCalendar from './PersianCalendar'

interface PayableFormProps {
  payable?: Payable
  categories: Category[]
  onSave: (data: {
    title: string
    categoryId: string
    totalAmount: number
    to: string
    notes: string
    dueDate?: string
  }) => void
  onCancel: () => void
}

function PayableForm({ payable, categories, onSave, onCancel }: PayableFormProps): JSX.Element {
  const { t } = useTranslation()
  const [title, setTitle] = useState(payable?.title ?? '')
  const [categoryId, setCategoryId] = useState(payable?.categoryId ?? categories[0]?.id ?? '')
  const [totalAmount, setTotalAmount] = useState(payable?.totalAmount?.toString() ?? '')
  const [to, setTo] = useState(payable?.to ?? '')
  const [notes, setNotes] = useState(payable?.notes ?? '')
  const [dueDate, setDueDate] = useState((payable as any)?.dueDate ?? '')
  const [showValidationModal, setShowValidationModal] = useState(false)
  const [missingFields, setMissingFields] = useState<string[]>([])

  const handleSubmit = (): void => {
    const parsedAmount = parseFloat(totalAmount)
    const fields: string[] = []
    if (!title.trim()) fields.push(t('payable.titleLabel'))
    if (!categoryId) fields.push(t('payable.category'))
    if (!totalAmount || isNaN(parsedAmount) || parsedAmount <= 0) fields.push(t('payable.totalAmount'))
    if (!to.trim()) fields.push(t('payable.to'))
    if (fields.length > 0) {
      setMissingFields(fields)
      setShowValidationModal(true)
      return
    }
    try {
      onSave({ title: title.trim(), categoryId, totalAmount: parsedAmount, to: to.trim(), notes, dueDate: dueDate || undefined })
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Save failed')
    }
  }

  return (
    <div style={styles.form}>
      <div style={styles.field}>
        <label style={styles.label}>{t('payable.titleLabel')}</label>
        <input
          style={styles.input}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={t('payable.titlePlaceholder')}
        />
      </div>
      <div style={styles.field}>
        <label style={styles.label}>{t('payable.category')}</label>
        <select style={styles.select} value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>
      <div style={styles.field}>
        <label style={styles.label}>{t('payable.to')}</label>
        <input
          style={styles.input}
          value={to}
          onChange={(e) => setTo(e.target.value)}
          placeholder={t('payable.toPlaceholder')}
        />
      </div>
      <div style={styles.field}>
        <label style={styles.label}>{t('payable.totalAmount')}</label>
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
        <label style={styles.label}>{t('payable.dueDate')}</label>
        <PersianCalendar value={dueDate} onChange={setDueDate} compact />
      </div>
      <div style={styles.field}>
        <label style={styles.label}>{t('payable.notes')}</label>
        <textarea
          style={styles.textarea}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder={t('payable.notesPlaceholder')}
        />
      </div>
      <div style={styles.buttons}>
        <button style={styles.cancelBtn} onClick={onCancel}>{t('common.cancel')}</button>
        <button style={styles.saveBtn} onClick={handleSubmit}>{t('common.save')}</button>
      </div>
      <Modal
        open={showValidationModal}
        onClose={() => setShowValidationModal(false)}
        title={t('payable.validationTitle')}
      >
        <p>{t('payable.validationMessage')}</p>
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

export default PayableForm
