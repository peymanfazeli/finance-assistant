import { useTranslation } from 'react-i18next'
import { Category } from '../../core/models/types'
import PersianCalendar from './PersianCalendar'

interface Props {
  dateFrom: string
  dateTo: string
  selectedCategoryIds: string[]
  selectedTypes: string[]
  categories: Category[]
  onDateFromChange: (v: string) => void
  onDateToChange: (v: string) => void
  onCategoryIdsChange: (ids: string[]) => void
  onTypesChange: (types: string[]) => void
}

const TYPE_OPTIONS = [
  { value: 'income', labelKey: 'transaction.income' },
  { value: 'expense', labelKey: 'transaction.expense' },
  { value: 'refund', labelKey: 'transaction.refund' },
  { value: 'investment', labelKey: 'transaction.investment' }
]

function ReportFilterPanel({
  dateFrom, dateTo, selectedCategoryIds, selectedTypes, categories,
  onDateFromChange, onDateToChange, onCategoryIdsChange, onTypesChange
}: Props): JSX.Element {
  const { t } = useTranslation()

  const toggleCategory = (id: string): void => {
    const next = selectedCategoryIds.includes(id)
      ? selectedCategoryIds.filter((c) => c !== id)
      : [...selectedCategoryIds, id]
    onCategoryIdsChange(next)
  }

  const toggleType = (type: string): void => {
    const next = selectedTypes.includes(type)
      ? selectedTypes.filter((t) => t !== type)
      : [...selectedTypes, type]
    onTypesChange(next)
  }

  return (
    <div style={styles.container}>
      <div style={styles.field}>
        <label style={styles.label}>{t('customReport.dateRange')}</label>
        <div style={styles.dateRow}>
          <PersianCalendar value={dateFrom} onChange={onDateFromChange} placeholder="From" compact />
          <span style={styles.sep}>-</span>
          <PersianCalendar value={dateTo} onChange={onDateToChange} placeholder="To" compact />
        </div>
      </div>

      <div style={styles.field}>
        <label style={styles.label}>{t('customReport.categories')}</label>
        <div style={styles.chipRow}>
          {categories.map((cat) => (
            <button
              key={cat.id}
              style={{
                ...styles.chip,
                backgroundColor: selectedCategoryIds.includes(cat.id) ? cat.color : '#f0f0f0',
                color: selectedCategoryIds.includes(cat.id) ? '#fff' : '#333'
              }}
              onClick={() => toggleCategory(cat.id)}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      <div style={styles.field}>
        <label style={styles.label}>{t('customReport.transactionTypes')}</label>
        <div style={styles.chipRow}>
          {TYPE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              style={{
                ...styles.chip,
                backgroundColor: selectedTypes.includes(opt.value) ? '#4A90D9' : '#f0f0f0',
                color: selectedTypes.includes(opt.value) ? '#fff' : '#333'
              }}
              onClick={() => toggleType(opt.value)}
            >
              {t(opt.labelKey)}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  container: { display: 'flex', flexDirection: 'column', gap: '12px' },
  field: { display: 'flex', flexDirection: 'column', gap: '4px' },
  label: { fontSize: '12px', fontWeight: 600, color: '#555' },
  dateRow: { display: 'flex', alignItems: 'center', gap: '8px' },
  dateInput: { padding: '6px 10px', fontSize: '13px', border: '1px solid #ccc', borderRadius: '4px' },
  sep: { color: '#888' },
  chipRow: { display: 'flex', gap: '6px', flexWrap: 'wrap' },
  chip: { padding: '4px 10px', fontSize: '12px', border: 'none', borderRadius: '12px', cursor: 'pointer' }
}

export default ReportFilterPanel
