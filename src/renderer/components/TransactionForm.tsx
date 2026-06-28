import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { TransactionType, Transaction, Category } from '../../core/models/types'

interface TransactionFormProps {
  transaction?: Transaction
  categories: Category[]
  onSave: (data: {
    date: string
    title: string
    categoryId: string
    type: TransactionType
    amount: number
    notes: string
  }) => void
  onCancel: () => void
}

function TransactionForm({ transaction, categories, onSave, onCancel }: TransactionFormProps): JSX.Element {
  const { t } = useTranslation()
  const [date, setDate] = useState(transaction?.date ?? new Date().toISOString().split('T')[0])
  const [title, setTitle] = useState(transaction?.title ?? '')
  const [categoryId, setCategoryId] = useState(transaction?.categoryId ?? categories[0]?.id ?? '')
  const [type, setType] = useState<TransactionType>(transaction?.type ?? TransactionType.Expense)
  const [amount, setAmount] = useState(transaction?.amount?.toString() ?? '')
  const [notes, setNotes] = useState(transaction?.notes ?? '')

  const handleSubmit = (): void => {
    const parsedAmount = parseFloat(amount)
    if (!title.trim() || isNaN(parsedAmount) || parsedAmount <= 0) return
    try {
      onSave({ date, title: title.trim(), categoryId, type, amount: parsedAmount, notes })
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Save failed')
    }
  }

  return (
    <div style={styles.form}>
      <div style={styles.field}>
        <label style={styles.label}>{t('transaction.date')}</label>
        <input style={styles.input} type="date" value={date} onChange={(e) => setDate(e.target.value)} />
      </div>
      <div style={styles.field}>
        <label style={styles.label}>{t('transaction.titleLabel')}</label>
        <input
          style={styles.input}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={t('transaction.titlePlaceholder')}
        />
      </div>
      <div style={styles.field}>
        <label style={styles.label}>{t('transaction.category')}</label>
        <select style={styles.select} value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>
      <div style={styles.field}>
        <label style={styles.label}>{t('transaction.type')}</label>
        <select style={styles.select} value={type} onChange={(e) => setType(e.target.value as TransactionType)}>
          <option value={TransactionType.Income}>{t('transaction.income')}</option>
          <option value={TransactionType.Expense}>{t('transaction.expense')}</option>
          <option value={TransactionType.Refund}>{t('transaction.refund')}</option>
        </select>
      </div>
      <div style={styles.field}>
        <label style={styles.label}>{t('transaction.amount')}</label>
        <input
          style={styles.input}
          type="number"
          step="0.01"
          min="0"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
      </div>
      <div style={styles.field}>
        <label style={styles.label}>{t('transaction.notes')}</label>
        <textarea
          style={styles.textarea}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder={t('transaction.notesPlaceholder')}
        />
      </div>
      <div style={styles.buttons}>
        <button style={styles.cancelBtn} onClick={onCancel}>{t('common.cancel')}</button>
        <button
          style={styles.saveBtn}
          onClick={handleSubmit}
          disabled={!title.trim() || !amount || parseFloat(amount) <= 0}
        >
          {t('common.save')}
        </button>
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  form: { padding: '16px', maxWidth: '480px' },
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

export default TransactionForm
