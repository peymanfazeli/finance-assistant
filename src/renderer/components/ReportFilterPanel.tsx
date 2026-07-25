import { useTranslation } from 'react-i18next'
import { Category } from '../../core/models/types'
import PersianCalendar from './PersianCalendar'
import { colors, spacing, fontSize, fontWeight, borderRadius, borderWidth } from '../../core/utils/styles'

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
  { value: 'income', labelKey: 'transaction.income', color: colors.text.income },
  { value: 'expense', labelKey: 'transaction.expense', color: colors.text.expense },
  { value: 'refund', labelKey: 'transaction.refund', color: colors.text.refund },
  { value: 'investment', labelKey: 'transaction.investment', color: colors.text.investment }
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
          {categories.map((cat) => {
            const isActive = selectedCategoryIds.includes(cat.id)
            return (
              <button
                key={cat.id}
                style={{
                  ...styles.chip,
                  backgroundColor: isActive ? cat.color : colors.bg.muted,
                  color: isActive ? '#fff' : colors.text.secondary,
                }}
                onClick={() => toggleCategory(cat.id)}
              >
                {cat.name}
              </button>
            )
          })}
        </div>
      </div>

      <div style={styles.field}>
        <label style={styles.label}>{t('customReport.transactionTypes')}</label>
        <div style={styles.chipRow}>
          {TYPE_OPTIONS.map((opt) => {
            const isActive = selectedTypes.includes(opt.value)
            return (
              <button
                key={opt.value}
                style={{
                  ...styles.chip,
                  backgroundColor: isActive ? colors.primary : colors.bg.muted,
                  color: isActive ? colors.text.inverse : colors.text.secondary,
                }}
                onClick={() => toggleType(opt.value)}
              >
                {t(opt.labelKey)}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  container: { display: 'flex', flexDirection: 'column', gap: spacing.lg },
  field: { display: 'flex', flexDirection: 'column', gap: spacing.sm },
  label: { fontSize: fontSize.xs, fontWeight: fontWeight.semibold, color: colors.text.muted, textTransform: 'uppercase', letterSpacing: '0.5px' },
  dateRow: { display: 'flex', alignItems: 'center', gap: spacing.sm },
  sep: { color: colors.text.disabled },
  chipRow: { display: 'flex', gap: spacing.xs, flexWrap: 'wrap' },
  chip: {
    padding: `${spacing.xs} ${spacing.md}`,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    border: 'none',
    borderRadius: borderRadius.sm,
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  }
}

export default ReportFilterPanel
