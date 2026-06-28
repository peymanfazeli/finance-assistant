import { useTranslation } from 'react-i18next'
import { Grouping, Aggregation } from '../../core/services/ReportService'

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
        <select style={styles.select} value={grouping} onChange={(e) => onGroupingChange(e.target.value as Grouping)}>
          {GROUPING_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{t(opt.labelKey)}</option>
          ))}
        </select>
      </div>
      <div style={styles.field}>
        <label style={styles.label}>Aggregation</label>
        <select style={styles.select} value={aggregation} onChange={(e) => onAggregationChange(e.target.value as Aggregation)}>
          {AGGREGATION_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.labelKey}</option>
          ))}
        </select>
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  container: { display: 'flex', gap: '16px', flexWrap: 'wrap' },
  field: { display: 'flex', flexDirection: 'column', gap: '4px' },
  label: { fontSize: '12px', fontWeight: 600, color: '#555' },
  select: { padding: '8px 12px', fontSize: '13px', border: '1px solid #ccc', borderRadius: '6px', backgroundColor: '#fff' }
}

export default GroupingSelector
