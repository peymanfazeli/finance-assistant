import { useTranslation } from 'react-i18next'

interface WelcomePageProps {
  onCreateDataset: () => void
  onImportData: () => void
}

function WelcomePage({ onCreateDataset, onImportData }: WelcomePageProps): JSX.Element {
  const { t } = useTranslation()

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>{t('welcome.title')}</h1>
        <p style={styles.subtitle}>{t('welcome.subtitle')}</p>
        <div style={styles.buttons}>
          <button style={styles.primaryButton} onClick={onCreateDataset}>
            {t('welcome.createDataset')}
          </button>
          <button style={styles.secondaryButton} onClick={onImportData}>
            {t('welcome.importData')}
          </button>
        </div>
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100vh',
    backgroundColor: '#f5f5f5'
  },
  card: {
    textAlign: 'center',
    padding: '48px',
    borderRadius: '12px',
    backgroundColor: '#fff',
    boxShadow: '0 2px 12px rgba(0,0,0,0.1)',
    maxWidth: '480px'
  },
  title: {
    fontSize: '28px',
    fontWeight: 700,
    margin: '0 0 8px',
    color: '#1a1a1a'
  },
  subtitle: {
    fontSize: '16px',
    color: '#666',
    margin: '0 0 32px'
  },
  buttons: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  },
  primaryButton: {
    padding: '14px 32px',
    fontSize: '16px',
    fontWeight: 600,
    color: '#fff',
    backgroundColor: '#4A90D9',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer'
  },
  secondaryButton: {
    padding: '14px 32px',
    fontSize: '16px',
    fontWeight: 600,
    color: '#4A90D9',
    backgroundColor: '#fff',
    border: '2px solid #4A90D9',
    borderRadius: '8px',
    cursor: 'pointer'
  }
}

export default WelcomePage
