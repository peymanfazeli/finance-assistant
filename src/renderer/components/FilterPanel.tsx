import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { TransactionType, Category, TransactionFilter } from '../../core/models/types'
import PersianCalendar from './PersianCalendar'

interface FilterPanelProps {
  categories: Category[]
  onApply: (filter: TransactionFilter) => void
  onClearSearch?: () => void
}

function FilterPanel({ categories, onApply, onClearSearch }: FilterPanelProps): JSX.Element {
  const { t } = useTranslation()
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [selectedTypes, setSelectedTypes] = useState<TransactionType[]>([])
  const [amountMin, setAmountMin] = useState('')
  const [amountMax, setAmountMax] = useState('')

  const apply = (): void => {
    onApply({
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
      categoryIds: selectedCategories.length > 0 ? selectedCategories : undefined,
      types: selectedTypes.length > 0 ? selectedTypes : undefined,
      amountMin: amountMin ? parseFloat(amountMin) : undefined,
      amountMax: amountMax ? parseFloat(amountMax) : undefined
    })
  }

  const clear = (): void => {
    setDateFrom('')
    setDateTo('')
    setSelectedCategories([])
    setSelectedTypes([])
    setAmountMin('')
    setAmountMax('')
    onClearSearch?.()
    onApply({})
  }

  const toggleCategory = (id: string): void => {
    setSelectedCategories((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    )
  }

  const toggleType = (type: TransactionType): void => {
    setSelectedTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    )
  }

  return (
    <div style={styles.container}>
      <div style={styles.row}>
        <div style={styles.field}>
          <label style={styles.label}>{t('common.filter')} Date</label>
          <PersianCalendar value={dateFrom} onChange={setDateFrom} placeholder="From" compact />
          <span style={styles.separator}>-</span>
          <PersianCalendar value={dateTo} onChange={setDateTo} placeholder="To" compact />
        </div>
        <div style={styles.field}>
          <label style={styles.label}>{t('transaction.amount')}</label>
          <input
            style={styles.smallInput}
            type="number"
            placeholder="Min"
            value={amountMin}
            onChange={(e) => setAmountMin(e.target.value)}
          />
          <span style={styles.separator}>-</span>
          <input
            style={styles.smallInput}
            type="number"
            placeholder="Max"
            value={amountMax}
            onChange={(e) => setAmountMax(e.target.value)}
          />
        </div>
      </div>
      <div style={styles.chips}>
        {categories.map((c) => (
          <button
            key={c.id}
            style={{
              ...styles.chip,
              backgroundColor: selectedCategories.includes(c.id) ? c.color : '#f0f0f0',
              color: selectedCategories.includes(c.id) ? '#fff' : '#333'
            }}
            onClick={() => toggleCategory(c.id)}
          >
            {c.name}
          </button>
        ))}
      </div>
      <div style={styles.chips}>
        {[TransactionType.Income, TransactionType.Expense, TransactionType.Refund, TransactionType.Investment].map((type) => (
          <button
            key={type}
            style={{
              ...styles.chip,
              backgroundColor: selectedTypes.includes(type) ? '#4A90D9' : '#f0f0f0',
              color: selectedTypes.includes(type) ? '#fff' : '#333'
            }}
            onClick={() => toggleType(type)}
          >
            {t(`transaction.${type}`)}
          </button>
        ))}
      </div>
      <div style={styles.buttons}>
        <button style={styles.applyBtn} onClick={apply}>{t('common.filter')}</button>
        <button style={styles.clearBtn} onClick={clear}>{t('common.clear')}</button>
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  container: { padding: '12px', backgroundColor: '#f9f9f9', borderRadius: '8px', marginBottom: '12px' },
  row: { display: 'flex', gap: '16px', marginBottom: '12px' },
  field: { display: 'flex', alignItems: 'center', gap: '4px' },
  label: { fontSize: '12px', fontWeight: 500, color: '#555', marginRight: '4px' },
  input: { padding: '6px 8px', fontSize: '13px', border: '1px solid #ccc', borderRadius: '4px', width: '130px' },
  smallInput: { padding: '6px 8px', fontSize: '13px', border: '1px solid #ccc', borderRadius: '4px', width: '80px' },
  separator: { margin: '0 4px', color: '#888' },
  chips: { display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '8px' },
  chip: {
    padding: '4px 10px',
    fontSize: '12px',
    border: '1px solid #ddd',
    borderRadius: '12px',
    cursor: 'pointer'
  },
  buttons: { display: 'flex', gap: '8px', marginTop: '8px' },
  applyBtn: {
    padding: '6px 14px',
    fontSize: '13px',
    color: '#fff',
    backgroundColor: '#4A90D9',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer'
  },
  clearBtn: {
    padding: '6px 14px',
    fontSize: '13px',
    color: '#666',
    backgroundColor: '#f0f0f0',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer'
  }
}

export default FilterPanel
