import { useTranslation } from 'react-i18next'
import { Grouping, Aggregation } from '../../core/services/ReportService'
import { colors, spacing, fontSize, fontWeight, borderRadius, borderWidth } from '../../core/utils/styles'

interface Props {
  grouping: Grouping
  aggregation: Aggregation
  onGroupingChange: (g: Grouping) => void
  onAggregationChange: (a: Aggregation) => void
}

const GROUPING_OPTIONS: { value: Grouping; labelKey: string }[] = [
  { value: 'day', labelKey: 'customReport.day' },
  { value: 'week', labelKey: 'customReport.week' },
  { value: 'month', labelKey: 'customReport.month' },
  { value: 'year', labelKey: 'customReport.year' }
]

const AGGREGATION_OPTIONS: { value: Aggregation; labelKey: string }[] = [
  { value: 'sum', labelKey: 'Sum' },
  { value: 'count', labelKey: 'Count' },
  { value: 'avg', labelKey: 'Average' }
]

function GroupingSelector({ grouping, aggregation, onGroupingChange, onAggregationChange }: Props): JSX.Element {
  const { t } = useTranslation()

  return (
    <div style={styles.container}>
      <div style={styles.field}>
        <label style={styles.label}>{t('customReport.grouping')}</label>
        <div style={styles.segmentedControl}>
          {GROUPING_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              style={{
                ...styles.segmentBtn,
                ...(grouping === opt.value ? styles.segmentBtnActive : {}),
              }}
              onClick={() => onGroupingChange(opt.value)}
            >
              {t(opt.labelKey)}
            </button>
          ))}
        </div>
      </div>
      <div style={styles.field}>
        <label style={styles.label}>{t('reports.chartType')}</label>
        <div style={styles.segmentedControl}>
          {AGGREGATION_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              style={{
                ...styles.segmentBtn,
                ...(aggregation === opt.value ? styles.segmentBtnActive : {}),
              }}
              onClick={() => onAggregationChange(opt.value)}
            >
              {opt.labelKey}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  container: { display: 'flex', flexDirection: 'column', gap: spacing.lg },
  field: { display: 'flex', flexDirection: 'column', gap: spacing.sm },
  label: { fontSize: fontSize.xs, fontWeight: fontWeight.semibold, color: colors.text.muted, textTransform: 'uppercase', letterSpacing: '0.5px' },
  segmentedControl: {
    display: 'flex',
    gap: '2px',
    backgroundColor: colors.bg.muted,
    borderRadius: borderRadius.md,
    padding: '3px',
  },
  segmentBtn: {
    flex: 1,
    padding: `${spacing.xs} ${spacing.sm}`,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.text.muted,
    backgroundColor: 'transparent',
    border: 'none',
    borderRadius: borderRadius.sm,
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },
  segmentBtnActive: {
    backgroundColor: colors.bg.card,
    color: colors.primary,
    fontWeight: fontWeight.semibold,
    boxShadow: '0 1px 2px rgba(0,0,0,0.06)',
  },
}

export default GroupingSelector
