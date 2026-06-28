import { useTranslation } from 'react-i18next'
import { ImportedRow } from '../../core/services/ImportService'

interface ImportConfirmDialogProps {
  totalRows: number
  skippedRows: number
  imported: ImportedRow[]
  onConfirm: () => void
  onCancel: () => void
}

function ImportConfirmDialog({
  totalRows,
  skippedRows,
  onConfirm,
  onCancel
}: ImportConfirmDialogProps): JSX.Element {
  const { t } = useTranslation()
  const importing = totalRows - skippedRows

  return (
    <div style={styles.overlay}>
      <div style={styles.dialog}>
        <h3 style={styles.title}>{t('import.confirmImport', { count: importing })}</h3>
        <p style={styles.info}>
          {importing} of {totalRows} rows will be imported
          {skippedRows > 0 && ` (${skippedRows} skipped as duplicates)`}
        </p>
        <div style={styles.buttons}>
          <button style={styles.cancelBtn} onClick={onCancel}>{t('common.cancel')}</button>
          <button style={styles.confirmBtn} onClick={onConfirm}>{t('common.confirm')}</button>
        </div>
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000
  },
  dialog: {
    backgroundColor: '#fff',
    borderRadius: '12px',
    padding: '24px',
    width: '360px',
    boxShadow: '0 4px 24px rgba(0,0,0,0.15)'
  },
  title: { fontSize: '18px', fontWeight: 600, margin: '0 0 8px', color: '#1a1a1a' },
  info: { fontSize: '14px', color: '#666', margin: '0 0 20px' },
  buttons: { display: 'flex', justifyContent: 'flex-end', gap: '8px' },
  cancelBtn: {
    padding: '8px 16px',
    fontSize: '13px',
    color: '#666',
    backgroundColor: '#f0f0f0',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer'
  },
  confirmBtn: {
    padding: '8px 16px',
    fontSize: '13px',
    color: '#fff',
    backgroundColor: '#4A90D9',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer'
  }
}

export default ImportConfirmDialog
