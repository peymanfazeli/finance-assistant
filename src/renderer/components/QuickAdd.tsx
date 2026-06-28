import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Category } from '../../core/models/types'

interface QuickAddProps {
  categories: Category[]
  onAdd: (amount: number, categoryId: string, notes: string) => void
}

function QuickAdd({ categories, onAdd }: QuickAddProps): JSX.Element {
  const { t } = useTranslation()
  const [amount, setAmount] = useState('')
  const [categoryId, setCategoryId] = useState(categories[0]?.id ?? '')

  const handleAdd = (): void => {
    const parsed = parseFloat(amount)
    if (isNaN(parsed) || parsed <= 0) return
    onAdd(parsed, categoryId, '')
    setAmount('')
  }

  return (
    <div style={styles.container}>
      <input
        style={styles.input}
        type="number"
        step="0.01"
        min="0"
        placeholder="0.00"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
      />
      <select
        style={styles.select}
        value={categoryId}
        onChange={(e) => setCategoryId(e.target.value)}
      >
        {categories.map((c) => (
          <option key={c.id} value={c.id}>{c.name}</option>
        ))}
      </select>
      <button style={styles.button} onClick={handleAdd} disabled={!amount || parseFloat(amount) <= 0}>
        {t('transaction.quickAdd')}
      </button>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  container: { display: 'flex', gap: '8px', alignItems: 'center' },
  input: {
    width: '120px',
    padding: '8px 10px',
    fontSize: '14px',
    border: '1px solid #ccc',
    borderRadius: '6px'
  },
  select: {
    padding: '8px 10px',
    fontSize: '14px',
    border: '1px solid #ccc',
    borderRadius: '6px',
    backgroundColor: '#fff'
  },
  button: {
    padding: '8px 16px',
    fontSize: '13px',
    fontWeight: 600,
    color: '#fff',
    backgroundColor: '#4A90D9',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer'
  }
}

export default QuickAdd
