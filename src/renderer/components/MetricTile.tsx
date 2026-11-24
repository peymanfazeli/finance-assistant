import { colors, fontSize, fontWeight, spacing } from '../../core/utils/styles'

interface MetricTileProps {
  label: string
  value: string
  hint?: string
  tone?: 'default' | 'primary' | 'success' | 'danger' | 'warning'
}

const toneColor: Record<NonNullable<MetricTileProps['tone']>, string> = {
  default: colors.text.primary,
  primary: colors.primary,
  success: colors.text.income,
  danger: colors.text.expense,
  warning: colors.text.warning,
}

export default function MetricTile({ label, value, hint, tone = 'default' }: MetricTileProps): JSX.Element {
  return (
    <div style={styles.tile}>
      <span style={styles.label}>{label}</span>
      <span style={{ ...styles.value, color: toneColor[tone] }}>{value}</span>
      {hint && <span style={styles.hint}>{hint}</span>}
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  tile: {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.sm,
    minWidth: 0,
  },
  label: {
    color: colors.text.muted,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    lineHeight: 1.35,
  },
  value: {
    color: colors.text.primary,
    fontSize: fontSize.metric,
    fontWeight: fontWeight.bold,
    lineHeight: 1.2,
    fontVariantNumeric: 'tabular-nums',
    overflowWrap: 'anywhere',
  },
  hint: {
    color: colors.text.subtle,
    fontSize: fontSize.xs,
    lineHeight: 1.4,
  },
}
