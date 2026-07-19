import { useState } from 'react'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { useAppStore } from '../../core/store/useAppStore'
import { Language, TransactionType } from '../../core/models/types'
import { colors, spacing, fontSize, fontWeight, borderRadius } from '../../core/utils/styles'
import Modal from '../components/Modal'

function SettingsPage(): JSX.Element {
  const { t, i18n } = useTranslation()
  const { settings, setLanguage, dataset, updateCategoryTypeMap } = useAppStore()
  const [showMappingModal, setShowMappingModal] = useState(false)
  const categoryTypeMap = dataset?.categoryTypeMap ?? {}
  const categories = dataset?.categories ?? []

  const handleLanguageChange = (lang: Language): void => {
    setLanguage(lang)
    i18n.changeLanguage(lang)
    document.documentElement.dir = lang === Language.Fa ? 'rtl' : 'ltr'
    document.documentElement.lang = lang
  }

  const typeOptions = [
    { value: '', label: t('settings.none') },
    { value: TransactionType.Income, label: t('transaction.income') },
    { value: TransactionType.Expense, label: t('transaction.expense') },
    { value: TransactionType.Refund, label: t('transaction.refund') },
    { value: TransactionType.Investment, label: t('transaction.investment') }
  ]

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
        <h3 style={styles.sectionTitle}>{t('settings.categoryTypeMapping')}</h3>
        <p style={styles.description}>{t('settings.categoryTypeDescription')}</p>
        {!dataset ? (
          <p style={styles.noDataset}>{t('settings.noDataset')}</p>
        ) : (
          <motion.button
            style={styles.mappingBtn}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowMappingModal(true)}
          >
            {t('settings.categoryTypeMapping')}
          </motion.button>
        )}
      </div>

      <Modal
        open={showMappingModal}
        onClose={() => setShowMappingModal(false)}
        title={t('settings.categoryTypeMapping')}
      >
        <p style={styles.description}>{t('settings.categoryTypeDescription')}</p>
        <div style={styles.modalScroll}>
          {categories.map((cat) => (
            <div key={cat.id} style={styles.mappingRow}>
              <span style={styles.categoryLabel}>
                <span style={styles.categoryIcon}>{cat.icon}</span>
                {cat.name}
              </span>
              <select
                style={styles.select}
                value={categoryTypeMap[cat.id] ?? ''}
                onChange={(e) => {
                  updateCategoryTypeMap(cat.id, e.target.value as TransactionType || null)
                }}
              >
                {typeOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          ))}
        </div>
      </Modal>

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
  description: { fontSize: fontSize.sm, color: colors.text.subtle, margin: `0 0 ${spacing.md}`, lineHeight: '1.5' },
  radioGroup: { display: 'flex', flexDirection: 'column', gap: spacing.sm },
  radio: { display: 'flex', alignItems: 'center', gap: spacing.sm, fontSize: fontSize.base, cursor: 'pointer' },
  about: { fontSize: fontSize.base, color: colors.text.subtle, margin: 0 },
  noDataset: { fontSize: fontSize.base, color: colors.text.subtle, fontStyle: 'italic' },
  mappingBtn: {
    padding: `${spacing.sm} ${spacing.lg}`,
    fontSize: fontSize.base,
    fontWeight: fontWeight.medium,
    color: colors.text.primary,
    backgroundColor: colors.bg.card,
    border: `1px solid ${colors.border.light}`,
    borderRadius: borderRadius.md,
    cursor: 'pointer',
    width: '100%',
    textAlign: 'left'
  },
  modalScroll: {
    maxHeight: '60vh',
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.sm
  },
  mappingRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md, padding: `${spacing.sm} ${spacing.md}`, backgroundColor: colors.bg.primary, borderRadius: borderRadius.md, border: `1px solid ${colors.border.light}` },
  categoryLabel: { display: 'flex', alignItems: 'center', gap: spacing.sm, fontSize: fontSize.base, color: colors.text.primary, minWidth: '150px' },
  categoryIcon: { fontSize: '18px' },
  select: { padding: '6px 10px', fontSize: fontSize.sm, border: `1px solid ${colors.border.light}`, borderRadius: borderRadius.sm, backgroundColor: colors.bg.card, minWidth: '140px', cursor: 'pointer' }
}

export default SettingsPage
