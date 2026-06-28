import { ColumnMapping as ColumnMappingType } from '../../core/services/ImportService'

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
  container: { marginTop: '16px' },
  title: { fontSize: '14px', fontWeight: 600, margin: '0 0 8px', color: '#333' },
  row: { display: 'flex', alignItems: 'center', gap: '8px', padding: '4px 0' },
  source: { minWidth: '120px', fontSize: '13px', color: '#555' },
  arrow: { color: '#888' },
  select: {
    padding: '4px 8px',
    fontSize: '13px',
    border: '1px solid #ccc',
    borderRadius: '4px',
    backgroundColor: '#fff'
  }
}

export default ColumnMapping
