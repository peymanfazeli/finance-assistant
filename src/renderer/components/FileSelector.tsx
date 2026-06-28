import { useTranslation } from 'react-i18next'

interface FileSelectorProps {
  onSelect: () => void
  fileName?: string
}

function FileSelector({ onSelect, fileName }: FileSelectorProps): JSX.Element {
  const { t } = useTranslation()

  return (
    <div style={styles.container}>
      <button style={styles.button} onClick={onSelect}>
        {t('import.selectFile')}
      </button>
      <span style={styles.info}>
        {fileName ?? t('import.noFileSelected')}
      </span>
      <span style={styles.formats}>{t('import.supportedFormats')}</span>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '16px',
    backgroundColor: '#f9f9f9',
    borderRadius: '8px'
  },
  button: {
    padding: '10px 20px',
    fontSize: '14px',
    fontWeight: 600,
    color: '#fff',
    backgroundColor: '#4A90D9',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer'
  },
  info: { fontSize: '14px', color: '#333' },
  formats: { fontSize: '12px', color: '#888' }
}

export default FileSelector
