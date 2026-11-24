import { useTranslation } from 'react-i18next'
import { colors, spacing, fontSize, fontWeight, padding, borderRadius } from '../../core/utils/styles'
import { uiStyles } from '../uiStyles'

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
    gap: spacing.md,
    padding: padding.card,
    backgroundColor: colors.bg.subtle,
    borderRadius: borderRadius.md,
  },
  button: {
    ...uiStyles.button,
    padding: padding.buttonLg,
    border: 'none',
  },
  info: { fontSize: fontSize.base, color: colors.text.primary },
  formats: { fontSize: fontSize.sm, color: colors.text.muted },
}

export default FileSelector
