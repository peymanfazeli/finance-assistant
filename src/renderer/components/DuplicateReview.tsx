import { useTranslation } from 'react-i18next'
import { ImportedRow } from '../../core/services/ImportService'
import { formatCurrency } from '../../core/utils/format'
import { formatJalaliDate } from '../../core/utils/jalali'
import { colors, spacing, fontSize, fontWeight, padding, borderWidth, borderRadius } from '../../core/utils/styles'
import { uiStyles } from '../uiStyles'

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
  container: { marginTop: spacing.lg, padding: spacing.md, backgroundColor: colors.bg.warning, borderRadius: borderRadius.md },
  warning: { fontSize: fontSize.base, fontWeight: fontWeight.semibold, color: colors.text.warning, margin: `0 0 ${spacing.sm}` },
  list: { display: 'flex', flexDirection: 'column', gap: spacing.xs },
  row: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: `${spacing.xs} 0` },
  info: { fontSize: fontSize.md, color: colors.text.warning },
  toggleBtn: {
    ...uiStyles.buttonSecondary,
    padding: padding.badge,
    fontSize: fontSize.sm,
    color: colors.text.warning,
    backgroundColor: colors.bg.card,
    border: `${borderWidth.default} solid ${colors.warning}`,
  },
}

export default DuplicateReview
