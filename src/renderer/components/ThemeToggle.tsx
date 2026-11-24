import { useTranslation } from 'react-i18next'
import { Theme } from '../../core/models/types'
import { useAppStore } from '../../core/store/useAppStore'
import { colors, fontSize, fontWeight, borderRadius, spacing, borderWidth, shadow } from '../../core/utils/styles'

interface ThemeToggleProps {
  compact?: boolean
}

export default function ThemeToggle({ compact = false }: ThemeToggleProps): JSX.Element {
  const { t } = useTranslation()
  const theme = useAppStore((state) => state.settings.theme)
  const setTheme = useAppStore((state) => state.setTheme)
  const options: { value: Theme; label: string; icon: string }[] = [
    { value: Theme.Dark, label: t('theme.dark'), icon: '☾' },
    { value: Theme.Light, label: t('theme.light'), icon: '☀' },
  ]

  return (
    <div style={{ ...styles.container, ...(compact ? styles.compact : {}) }} role="group" aria-label={t('settings.theme')}>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          aria-pressed={theme === option.value}
          aria-label={theme === option.value ? option.label : t(option.value === Theme.Light ? 'theme.toggleToLight' : 'theme.toggleToDark')}
          onClick={() => setTheme(option.value)}
          style={{
            ...styles.option,
            ...(theme === option.value ? styles.optionActive : {}),
          }}
        >
          <span style={styles.icon}>{option.icon}</span>
          {!compact && <span>{option.label}</span>}
        </button>
      ))}
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    gap: spacing.xxs,
    padding: spacing.xxs,
    backgroundColor: colors.bg.subtle,
    border: `${borderWidth.default} solid ${colors.border.default}`,
    borderRadius: borderRadius.full,
  },
  compact: {
    width: '100%',
  },
  option: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    minWidth: '78px',
    padding: `${spacing.xs} ${spacing.md}`,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.text.muted,
    background: 'transparent',
    border: 'none',
    borderRadius: borderRadius.full,
    cursor: 'pointer',
    transition: 'background-color 0.15s ease, color 0.15s ease',
  },
  optionActive: {
    color: colors.text.inverse,
    background: colors.primary,
    boxShadow: shadow.dropdown,
  },
  icon: {
    fontSize: fontSize.lg,
    lineHeight: 1,
  },
}
