import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { colors, spacing, fontSize, fontWeight, borderRadius, borderWidth } from '../../core/utils/styles'

interface SearchBarProps {
  onSearch: (keyword: string) => void
}

function SearchBar({ onSearch }: SearchBarProps): JSX.Element {
  const { t } = useTranslation()
  const [value, setValue] = useState('')

  const handleChange = (val: string): void => {
    setValue(val)
    onSearch(val)
  }

  return (
    <div style={styles.container}>
      <span style={styles.icon}>🔍</span>
      <input
        style={styles.input}
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        placeholder={`${t('common.search')}...`}
      />
      {value && (
        <button style={styles.clear} onClick={() => handleChange('')}>
          ✕
        </button>
      )}
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  },
  icon: {
    position: 'absolute',
    left: spacing.md,
    fontSize: fontSize.sm,
    pointerEvents: 'none',
    opacity: 0.5,
  },
  input: {
    width: '100%',
    padding: `${spacing.sm} ${spacing.xxl} ${spacing.sm} ${spacing.xxxl}`,
    fontSize: fontSize.sm,
    border: `${borderWidth.default} solid ${colors.border.input}`,
    borderRadius: borderRadius.md,
    outline: 'none',
    backgroundColor: colors.bg.muted,
    transition: 'border-color 0.15s ease, background-color 0.15s ease',
  },
  clear: {
    position: 'absolute',
    right: spacing.sm,
    top: '50%',
    transform: 'translateY(-50%)',
    border: 'none',
    backgroundColor: 'transparent',
    cursor: 'pointer',
    color: colors.text.disabled,
    fontSize: fontSize.sm,
    padding: spacing.xs,
    lineHeight: 1,
  },
}

export default SearchBar
