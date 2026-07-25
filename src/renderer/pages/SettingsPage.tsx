import { useState } from 'react'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { useAppStore } from '../../core/store/useAppStore'
import { Language, TransactionType } from '../../core/models/types'
import { colors, spacing, fontSize, fontWeight, borderRadius, padding, shadow, borderWidth } from '../../core/utils/styles'
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

  const mappedCount = Object.keys(categoryTypeMap).length

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <div style={styles.header}>
          <h2 style={styles.title}>{t('settings.title')}</h2>
          <p style={styles.subtitle}>Configure your application preferences</p>
        </div>

        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <span style={styles.cardIcon}>🌐</span>
            <div>
              <h3 style={styles.cardTitle}>{t('settings.language')}</h3>
              <p style={styles.cardDescription}>Choose your preferred language for the interface</p>
            </div>
          </div>
          <div style={styles.languageToggle}>
            <button
              style={{
                ...styles.langBtn,
                ...(settings.language === Language.En ? styles.langBtnActive : {}),
              }}
              onClick={() => handleLanguageChange(Language.En)}
            >
              <span style={styles.langFlag}>🇺🇸</span>
              <span style={styles.langName}>{t('settings.english')}</span>
            </button>
            <button
              style={{
                ...styles.langBtn,
                ...(settings.language === Language.Fa ? styles.langBtnActive : {}),
              }}
              onClick={() => handleLanguageChange(Language.Fa)}
            >
              <span style={styles.langFlag}>🇮🇷</span>
              <span style={styles.langName}>{t('settings.persian')}</span>
            </button>
          </div>
        </div>

        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <span style={styles.cardIcon}>🏷️</span>
            <div>
              <h3 style={styles.cardTitle}>{t('settings.categoryTypeMapping')}</h3>
              <p style={styles.cardDescription}>{t('settings.categoryTypeDescription')}</p>
            </div>
          </div>
          {!dataset ? (
            <div style={styles.noDataset}>
              <span style={styles.noDatasetIcon}>📂</span>
              <p>{t('settings.noDataset')}</p>
            </div>
          ) : (
            <div style={styles.mappingPreview}>
              <div style={styles.mappingStats}>
                <div style={styles.statItem}>
                  <span style={styles.statValue}>{categories.length}</span>
                  <span style={styles.statLabel}>Categories</span>
                </div>
                <div style={styles.statDivider} />
                <div style={styles.statItem}>
                  <span style={styles.statValue}>{mappedCount}</span>
                  <span style={styles.statLabel}>Mapped</span>
                </div>
                <div style={styles.statDivider} />
                <div style={styles.statItem}>
                  <span style={styles.statValue}>{categories.length - mappedCount}</span>
                  <span style={styles.statLabel}>Unmapped</span>
                </div>
              </div>
              <motion.button
                style={styles.mappingBtn}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={() => setShowMappingModal(true)}
              >
                {t('settings.categoryTypeMapping')}
                <span style={styles.arrow}>→</span>
              </motion.button>
            </div>
          )}
        </div>

        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <span style={styles.cardIcon}>ℹ️</span>
            <div>
              <h3 style={styles.cardTitle}>{t('settings.about')}</h3>
              <p style={styles.cardDescription}>Finance Assistant</p>
            </div>
          </div>
          <div style={styles.aboutContent}>
            <div style={styles.aboutRow}>
              <span style={styles.aboutLabel}>Version</span>
              <span style={styles.aboutValue}>0.1.0</span>
            </div>
            <div style={styles.aboutRow}>
              <span style={styles.aboutLabel}>Platform</span>
              <span style={styles.aboutValue}>Electron + React</span>
            </div>
          </div>
        </div>
      </div>

      <Modal
        open={showMappingModal}
        onClose={() => setShowMappingModal(false)}
        title={t('settings.categoryTypeMapping')}
      >
        <p style={styles.modalDescription}>{t('settings.categoryTypeDescription')}</p>
        <div style={styles.modalScroll}>
          {categories.map((cat) => (
            <div key={cat.id} style={styles.mappingRow}>
              <span style={styles.categoryLabel}>
                <span style={styles.categoryIcon}>{cat.icon}</span>
                <span style={styles.categoryName}>{cat.name}</span>
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
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    height: '100%',
    overflow: 'auto',
    padding: spacing.xxl,
  },
  container: {
    maxWidth: '640px',
    margin: '0 auto',
  },
  header: {
    marginBottom: spacing.xxl,
  },
  title: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.semibold,
    margin: 0,
    color: colors.text.primary,
  },
  subtitle: {
    fontSize: fontSize.sm,
    color: colors.text.disabled,
    margin: `${spacing.xs} 0 0`,
  },
  card: {
    backgroundColor: colors.bg.card,
    borderRadius: borderRadius.lg,
    border: `${borderWidth.default} solid ${colors.border.light}`,
    padding: spacing.xl,
    marginBottom: spacing.lg,
  },
  cardHeader: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  cardIcon: {
    fontSize: fontSize.xl,
    marginTop: '2px',
  },
  cardTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    margin: 0,
    color: colors.text.primary,
  },
  cardDescription: {
    fontSize: fontSize.sm,
    color: colors.text.disabled,
    margin: `${spacing.xs} 0 0`,
    lineHeight: '1.4',
  },
  languageToggle: {
    display: 'flex',
    gap: spacing.sm,
  },
  langBtn: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    padding: `${spacing.md} ${spacing.lg}`,
    fontSize: fontSize.base,
    fontWeight: fontWeight.medium,
    color: colors.text.muted,
    backgroundColor: colors.bg.muted,
    border: `${borderWidth.default} solid ${colors.border.light}`,
    borderRadius: borderRadius.md,
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },
  langBtnActive: {
    backgroundColor: colors.bg.active,
    color: colors.primary,
    borderColor: colors.primary,
    fontWeight: fontWeight.semibold,
  },
  langFlag: {
    fontSize: fontSize.lg,
  },
  langName: {
    fontSize: fontSize.base,
  },
  noDataset: {
    display: 'flex',
    alignItems: 'center',
    gap: spacing.sm,
    padding: `${spacing.md} ${spacing.lg}`,
    backgroundColor: colors.bg.muted,
    borderRadius: borderRadius.md,
    color: colors.text.disabled,
    fontSize: fontSize.sm,
  },
  noDatasetIcon: {
    fontSize: fontSize.lg,
  },
  mappingPreview: {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.md,
  },
  mappingStats: {
    display: 'flex',
    alignItems: 'center',
    gap: spacing.lg,
    padding: `${spacing.md} ${spacing.lg}`,
    backgroundColor: colors.bg.muted,
    borderRadius: borderRadius.md,
  },
  statItem: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '2px',
    flex: 1,
  },
  statValue: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.text.primary,
  },
  statLabel: {
    fontSize: fontSize.xs,
    color: colors.text.disabled,
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  statDivider: {
    width: '1px',
    height: '32px',
    backgroundColor: colors.border.divider,
  },
  mappingBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    padding: `${spacing.md} ${spacing.lg}`,
    fontSize: fontSize.base,
    fontWeight: fontWeight.medium,
    color: colors.primary,
    backgroundColor: colors.bg.card,
    border: `${borderWidth.default} solid ${colors.primary}`,
    borderRadius: borderRadius.md,
    cursor: 'pointer',
  },
  arrow: {
    fontSize: fontSize.lg,
  },
  aboutContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1px',
    backgroundColor: colors.border.light,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
  },
  aboutRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: `${spacing.sm} ${spacing.lg}`,
    backgroundColor: colors.bg.card,
  },
  aboutLabel: {
    fontSize: fontSize.sm,
    color: colors.text.muted,
  },
  aboutValue: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.text.primary,
  },
  modalDescription: {
    fontSize: fontSize.sm,
    color: colors.text.subtle,
    margin: `0 0 ${spacing.lg}`,
    lineHeight: '1.5',
  },
  modalScroll: {
    maxHeight: '60vh',
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.sm,
  },
  mappingRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    padding: `${spacing.sm} ${spacing.md}`,
    backgroundColor: colors.bg.muted,
    borderRadius: borderRadius.md,
  },
  categoryLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: spacing.sm,
    minWidth: '150px',
  },
  categoryIcon: {
    fontSize: fontSize.lg,
  },
  categoryName: {
    fontSize: fontSize.base,
    color: colors.text.primary,
  },
  select: {
    padding: `${spacing.xs} ${spacing.sm}`,
    fontSize: fontSize.sm,
    border: `${borderWidth.default} solid ${colors.border.input}`,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.bg.card,
    minWidth: '140px',
    cursor: 'pointer',
  },
}

export default SettingsPage
