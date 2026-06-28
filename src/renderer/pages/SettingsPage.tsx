import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { useAppStore } from '../../core/store/useAppStore'
import { Language } from '../../core/models/types'
import { colors, spacing, fontSize, fontWeight, borderRadius } from '../../core/utils/styles'

function SettingsPage(): JSX.Element {
  const { t, i18n } = useTranslation()
  const { settings, setLanguage } = useAppStore()

  const handleLanguageChange = (lang: Language): void => {
    setLanguage(lang)
    i18n.changeLanguage(lang)
    document.documentElement.dir = lang === Language.Fa ? 'rtl' : 'ltr'
    document.documentElement.lang = lang
  }

  return (
    <motion.div style={styles.container}>
      <h2 style={styles.title}>{t('settings.title')}</h2>

      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>{t('settings.language')}</h3>
        <div style={styles.radioGroup}>
          <label style={styles.radio}>
            <input
              type="radio"
              name="language"
              checked={settings.language === Language.En}
              onChange={() => handleLanguageChange(Language.En)}
            />
            {t('settings.english')}
          </label>
          <label style={styles.radio}>
            <input
              type="radio"
              name="language"
              checked={settings.language === Language.Fa}
              onChange={() => handleLanguageChange(Language.Fa)}
            />
            {t('settings.persian')}
          </label>
        </div>
      </div>

      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>{t('settings.about')}</h3>
        <p style={styles.about}>Finance Assistant v0.1.0</p>
      </div>
    </motion.div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  container: { padding: spacing.xxl, maxWidth: '600px' },
  title: { fontSize: fontSize.xxl, fontWeight: fontWeight.semibold, margin: `0 0 ${spacing.xxl}`, color: colors.text.primary },
  section: { marginBottom: spacing.xxl },
  sectionTitle: { fontSize: fontSize.lg, fontWeight: fontWeight.semibold, margin: `0 0 ${spacing.md}`, color: colors.text.secondary },
  radioGroup: { display: 'flex', flexDirection: 'column', gap: spacing.sm },
  radio: { display: 'flex', alignItems: 'center', gap: spacing.sm, fontSize: fontSize.base, cursor: 'pointer' },
  about: { fontSize: fontSize.base, color: colors.text.subtle, margin: 0 },
}

export default SettingsPage
