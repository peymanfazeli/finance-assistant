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

function SummaryCard({ title, value, color, isMasked }: SummaryCardProps): JSX.Element {
  const prefersReduced = useReducedMotion()
  const accent = color ?? colors.primary

  return (
    <motion.div
      style={styles.card}
      whileHover={prefersReduced ? {} : { y: -2, boxShadow: shadow.elevated }}
    >
      <div style={{ ...styles.accent, backgroundColor: accent }} />
      <div style={styles.content}>
        <span style={styles.title}>{title}</span>
        <span style={{ ...styles.value, color: colors.text.primary }}>{isMasked ? '***' : value}</span>
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
    transition: 'box-shadow 0.15s',
  },
  accent: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: '3px',
  },
  content: {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.xs,
    paddingLeft: spacing.sm,
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
  },
}

export default SummaryCard
