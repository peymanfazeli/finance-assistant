import { useTranslation } from 'react-i18next'
import { ImportedRow } from '../../core/services/ImportService'
import { formatCurrency } from '../../core/utils/format'
import { formatJalaliDate } from '../../core/utils/jalali'

interface DuplicateReviewProps {
  imported: ImportedRow[]
  duplicates: boolean[]
  onToggle: (index: number) => void
  currency?: string
  locale?: string
}

function DuplicateReview({ imported, duplicates, onToggle, currency = 'toman', locale = 'en-US' }: DuplicateReviewProps): JSX.Element {
  const { t, i18n } = useTranslation()
  const usePersianDigits = i18n.language === 'fa'
  const duplicateCount = duplicates.filter(Boolean).length

  if (duplicateCount === 0) return <></>

  return (
    <div style={styles.container}>
      <p style={styles.warning}>
        ⚠️ {duplicateCount} {t('import.duplicatesFound')}
      </p>
      <div style={styles.list}>
        {imported.map((row, i) =>
          duplicates[i] ? (
            <div key={i} style={styles.row}>
              <span style={styles.info}>
                {formatJalaliDate(row.date, usePersianDigits)} - {row.title} - {formatCurrency(row.amount, currency, locale)}
              </span>
              <button style={styles.toggleBtn} onClick={() => onToggle(i)}>
                {t('import.skip')}
              </button>
            </div>
          ) : null
        )}
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  container: { marginTop: '16px', padding: '12px', backgroundColor: '#fff3cd', borderRadius: '8px' },
  warning: { fontSize: '14px', fontWeight: 600, color: '#856404', margin: '0 0 8px' },
  list: { display: 'flex', flexDirection: 'column', gap: '4px' },
  row: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 0' },
  info: { fontSize: '13px', color: '#856404' },
  toggleBtn: {
    padding: '2px 8px',
    fontSize: '12px',
    color: '#856404',
    backgroundColor: '#fff',
    border: '1px solid #856404',
    borderRadius: '4px',
    cursor: 'pointer'
  }
}

export default DuplicateReview
