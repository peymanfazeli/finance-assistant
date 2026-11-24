import { useTranslation } from 'react-i18next'
import { colors, fontSize, fontWeight, padding, spacing } from '../../core/utils/styles'
import { uiStyles } from '../uiStyles'

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
    padding: `${spacing.massive} ${spacing.xxl}`,
    textAlign: 'center',
  },
  icon: {
    fontSize: fontSize.icon,
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.semibold,
    color: colors.text.primary,
    margin: `0 0 ${spacing.sm}`,
  },
  subtitle: {
    fontSize: fontSize.base,
    color: colors.text.muted,
    margin: `0 0 ${spacing.xxl}`,
    maxWidth: '320px',
  },
  button: {
    ...uiStyles.button,
    padding: padding.buttonXl,
    fontSize: '15px',
  },
}

export default EmptyTransactionList
