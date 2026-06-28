import { useTranslation } from 'react-i18next'

interface EmptyTransactionListProps {
  onAddTransaction: () => void
}

function EmptyTransactionList({ onAddTransaction }: EmptyTransactionListProps): JSX.Element {
  const { t } = useTranslation()

  return (
    <div style={styles.container}>
      <div style={styles.icon}>📊</div>
      <h2 style={styles.title}>{t('transaction.noTransactions')}</h2>
      <p style={styles.subtitle}>
        {t('welcome.subtitle')}
      </p>
      <button style={styles.button} onClick={onAddTransaction}>
        {t('transaction.add')}
      </button>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '64px 24px',
    textAlign: 'center'
  },
  icon: {
    fontSize: '48px',
    marginBottom: '16px'
  },
  title: {
    fontSize: '18px',
    fontWeight: 600,
    color: '#1a1a1a',
    margin: '0 0 8px'
  },
  subtitle: {
    fontSize: '14px',
    color: '#888',
    margin: '0 0 24px',
    maxWidth: '320px'
  },
  button: {
    padding: '12px 28px',
    fontSize: '15px',
    fontWeight: 600,
    color: '#fff',
    backgroundColor: '#4A90D9',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer'
  }
}

export default EmptyTransactionList
