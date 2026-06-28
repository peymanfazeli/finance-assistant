interface SummaryCardProps {
  title: string
  value: string
  icon?: string
  color?: string
}

function SummaryCard({ title, value, icon, color }: SummaryCardProps): JSX.Element {
  return (
    <div style={styles.card}>
      {icon && <span style={styles.icon}>{icon}</span>}
      <div style={styles.content}>
        <span style={styles.title}>{title}</span>
        <span style={{ ...styles.value, color: color ?? '#1a1a1a' }}>{value}</span>
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  card: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    padding: '20px',
    backgroundColor: '#fff',
    borderRadius: '10px',
    boxShadow: '0 1px 6px rgba(0,0,0,0.08)',
    border: '1px solid #f0f0f0'
  },
  icon: { fontSize: '28px' },
  content: { display: 'flex', flexDirection: 'column', gap: '4px' },
  title: { fontSize: '12px', fontWeight: 500, color: '#888', textTransform: 'uppercase' },
  value: { fontSize: '22px', fontWeight: 700 }
}

export default SummaryCard
