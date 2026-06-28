import { motion } from 'framer-motion'
import { colors, spacing, fontSize, fontWeight, borderRadius, padding, shadow, borderWidth } from '../../core/utils/styles'
import useReducedMotion from '../hooks/useReducedMotion'

interface SummaryCardProps {
  title: string
  value: string
  icon?: string
  color?: string
}

function SummaryCard({ title, value, icon, color }: SummaryCardProps): JSX.Element {
  const prefersReduced = useReducedMotion()

  return (
    <motion.div
      style={styles.card}
      whileHover={prefersReduced ? {} : { y: -3, boxShadow: shadow.elevated }}
    >
      {icon && <span style={styles.icon}>{icon}</span>}
      <div style={styles.content}>
        <span style={styles.title}>{title}</span>
        <span style={{ ...styles.value, color: color ?? colors.text.primary }}>{value}</span>
      </div>
    </motion.div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  card: {
    display: 'flex',
    alignItems: 'center',
    gap: spacing.lg,
    padding: padding.card,
    backgroundColor: colors.bg.card,
    borderRadius: borderRadius.xl,
    boxShadow: shadow.elevated,
    border: `${borderWidth.default} solid ${colors.border.light}`,
    transition: 'box-shadow 0.15s',
  },
  icon: { fontSize: fontSize.icon },
  content: { display: 'flex', flexDirection: 'column', gap: spacing.xs },
  title: { fontSize: fontSize.sm, fontWeight: fontWeight.medium, color: colors.text.disabled, textTransform: 'uppercase' },
  value: { fontSize: fontSize.xxxl, fontWeight: fontWeight.bold },
}

export default SummaryCard
