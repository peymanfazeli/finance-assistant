import { motion } from 'framer-motion'
import { colors, spacing, fontSize, fontWeight, borderRadius, padding, shadow, borderWidth } from '../../core/utils/styles'
import useReducedMotion from '../hooks/useReducedMotion'

interface SummaryCardProps {
  title: string
  value: string
  icon?: string
  color?: string
  isMasked?: boolean
}

function SummaryCard({ title, value, color, icon, isMasked }: SummaryCardProps): JSX.Element {
  const prefersReduced = useReducedMotion()
  const accent = color ?? colors.primary

  return (
    <motion.div
      style={styles.card}
      whileHover={prefersReduced ? {} : {
        y: -3,
        boxShadow: shadow.hero,
        borderColor: accent,
      }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
    >
      <div style={{ ...styles.accent, backgroundColor: accent }} />
      <div style={styles.content}>
        <div style={styles.titleRow}>
          {icon && <span style={styles.icon}>{icon}</span>}
          <span style={styles.title}>{title}</span>
        </div>
        <span style={styles.value}>{isMasked ? '***' : value}</span>
      </div>
    </motion.div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  card: {
    position: 'relative',
    overflow: 'hidden',
    display: 'flex',
    alignItems: 'center',
    padding: padding.card,
    backgroundColor: colors.bg.card,
    borderRadius: borderRadius.lg,
    boxShadow: shadow.card,
    border: `${borderWidth.default} solid ${colors.border.light}`,
    transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
  },
  accent: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: '4px',
    borderRadius: '0 2px 2px 0',
  },
  content: {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.xs,
    paddingLeft: spacing.md,
    flex: 1,
  },
  titleRow: {
    display: 'flex',
    alignItems: 'center',
    gap: spacing.xs,
  },
  icon: {
    fontSize: '14px',
    lineHeight: 1,
    flexShrink: 0,
  },
  title: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
    color: colors.text.disabled,
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  value: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
    fontVariantNumeric: 'tabular-nums',
    color: colors.text.primary,
  },
}

export default SummaryCard
