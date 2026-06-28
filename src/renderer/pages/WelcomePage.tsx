import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { colors, spacing, fontSize, fontWeight, borderRadius, padding, shadow, borderWidth, sizes } from '../../core/utils/styles'

interface WelcomePageProps {
  onCreateDataset: () => void
  onImportData: () => void
}

function WelcomePage({ onCreateDataset, onImportData }: WelcomePageProps): JSX.Element {
  const { t } = useTranslation()

  return (
    <motion.div
      style={styles.container}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      <motion.div
        style={styles.card}
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        <h1 style={styles.title}>{t('welcome.title')}</h1>
        <p style={styles.subtitle}>{t('welcome.subtitle')}</p>
        <div style={styles.buttons}>
          <motion.button
            style={styles.primaryButton}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={onCreateDataset}
          >
            {t('welcome.createDataset')}
          </motion.button>
          <motion.button
            style={styles.secondaryButton}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={onImportData}
          >
            {t('welcome.importData')}
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100vh',
    backgroundColor: colors.bg.page,
  },
  card: {
    textAlign: 'center',
    padding: padding.dialogLg,
    borderRadius: borderRadius.xxl,
    backgroundColor: colors.bg.card,
    boxShadow: shadow.welcome,
    maxWidth: sizes.formMaxWidth,
  },
  title: {
    fontSize: fontSize.display,
    fontWeight: fontWeight.bold,
    margin: `0 0 ${spacing.sm}`,
    color: colors.text.primary,
  },
  subtitle: {
    fontSize: fontSize.lg,
    color: colors.text.subtle,
    margin: `0 0 ${spacing.xxxl}`,
  },
  buttons: {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.md,
  },
  primaryButton: {
    padding: padding.buttonHero,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.text.inverse,
    backgroundColor: colors.primary,
    border: 'none',
    borderRadius: borderRadius.lg,
    cursor: 'pointer',
  },
  secondaryButton: {
    padding: padding.buttonHero,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.primary,
    backgroundColor: colors.bg.card,
    border: `${borderWidth.thick} solid ${colors.primary}`,
    borderRadius: borderRadius.lg,
    cursor: 'pointer',
  },
}

export default WelcomePage
