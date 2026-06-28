import { useTranslation } from 'react-i18next'
import { useAppStore } from '../../core/store/useAppStore'
import { Language } from '../../core/models/types'

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
    <div style={styles.container}>
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
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  container: { padding: '24px', maxWidth: '600px' },
  title: { fontSize: '20px', fontWeight: 600, margin: '0 0 24px', color: '#1a1a1a' },
  section: { marginBottom: '24px' },
  sectionTitle: { fontSize: '16px', fontWeight: 600, margin: '0 0 12px', color: '#333' },
  radioGroup: { display: 'flex', flexDirection: 'column', gap: '8px' },
  radio: { display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', cursor: 'pointer' },
  about: { fontSize: '14px', color: '#666', margin: 0 }
}

export default SettingsPage
