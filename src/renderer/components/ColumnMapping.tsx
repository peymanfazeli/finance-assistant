import { ColumnMapping as ColumnMappingType } from '../../core/services/ImportService'
import { colors, spacing, fontSize, fontWeight } from '../../core/utils/styles'
import { uiStyles } from '../uiStyles'

interface ColumnMappingProps {
  mapping: ColumnMappingType[]
  onChange: (mapping: ColumnMappingType[]) => void
}

const TARGET_FIELDS: ColumnMappingType['targetField'][] = [
  'date',
  'title',
  'category',
  'type',
  'amount',
  'notes'
]

function ColumnMapping({ mapping, onChange }: ColumnMappingProps): JSX.Element {
  const handleChange = (index: number, targetField: ColumnMappingType['targetField']): void => {
    const updated = mapping.map((m, i) =>
      i === index ? { ...m, targetField } : m
    )
    onChange(updated)
  }

  return (
    <div style={styles.container}>
      <h4 style={styles.title}>Column Mapping</h4>
      {mapping.map((m, i) => (
        <div key={m.sourceField} style={styles.row}>
          <span style={styles.source}>{m.sourceField}</span>
          <span style={styles.arrow}>→</span>
          <select
            style={styles.select}
            value={m.targetField}
            onChange={(e) => handleChange(i, e.target.value as ColumnMappingType['targetField'])}
          >
            {TARGET_FIELDS.map((f) => (
              <option key={f} value={f}>{f}</option>
            ))}
          </select>
        </div>
      ))}
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  container: { marginTop: spacing.lg },
  title: { fontSize: fontSize.base, fontWeight: fontWeight.semibold, margin: `0 0 ${spacing.sm}`, color: colors.text.primary },
  row: { display: 'flex', alignItems: 'center', gap: spacing.sm, padding: `${spacing.xs} 0` },
  source: { minWidth: '120px', fontSize: fontSize.md, color: colors.text.secondary },
  arrow: { color: colors.text.muted },
  select: {
    ...uiStyles.input,
    width: 'auto',
    padding: `${spacing.xxs} ${spacing.sm}`,
    fontSize: fontSize.md,
    borderRadius: '4px',
  },
}

export default ColumnMapping
