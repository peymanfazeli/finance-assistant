import { colors, spacing, fontSize, fontWeight, padding } from '../../core/utils/styles'
import { uiStyles } from '../uiStyles'

interface ImportPreviewProps {
  columns: string[]
  rows: Record<string, string>[]
}

function ImportPreview({ columns, rows }: ImportPreviewProps): JSX.Element {
  const displayRows = rows.slice(0, 10)

  return (
    <div style={styles.container}>
      <h4 style={styles.title}>Preview ({rows.length} rows)</h4>
      <div style={styles.tableWrap}>
        <table style={styles.table}>
          <thead>
            <tr>
              {columns.map((col) => (
                <th key={col} style={styles.th}>{col}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {displayRows.map((row, i) => (
              <tr key={i}>
                {columns.map((col) => (
                  <td key={col} style={styles.td}>{row[col]}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {rows.length > 10 && (
        <p style={styles.more}>...and {rows.length - 10} more rows</p>
      )}
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  container: { marginTop: spacing.lg },
  title: { fontSize: fontSize.base, fontWeight: fontWeight.semibold, margin: `0 0 ${spacing.sm}`, color: colors.text.primary },
  tableWrap: { overflowX: 'auto' },
  table: { ...uiStyles.table, fontSize: fontSize.md },
  th: {
    ...uiStyles.th,
    padding: '8px 10px',
    fontSize: fontSize.md,
  },
  td: {
    ...uiStyles.td,
    padding: padding.tableCellSm,
    maxWidth: '200px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  more: { fontSize: fontSize.sm, color: colors.text.muted, marginTop: spacing.sm },
}

export default ImportPreview
