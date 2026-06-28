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
  container: { marginTop: '16px' },
  title: { fontSize: '14px', fontWeight: 600, margin: '0 0 8px', color: '#333' },
  tableWrap: { overflowX: 'auto' },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: '13px' },
  th: {
    padding: '8px 10px',
    textAlign: 'left',
    fontWeight: 600,
    color: '#555',
    borderBottom: '2px solid #eee',
    whiteSpace: 'nowrap'
  },
  td: { padding: '6px 10px', borderBottom: '1px solid #f0f0f0', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis' },
  more: { fontSize: '12px', color: '#888', marginTop: '8px' }
}

export default ImportPreview
