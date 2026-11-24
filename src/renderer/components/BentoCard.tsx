import { colors, fontSize, fontWeight, spacing } from '../../core/utils/styles'

interface BentoCardProps {
  title?: string
  description?: string
  action?: React.ReactNode
  children: React.ReactNode
  span?: number
  tone?: 'default' | 'accent' | 'success' | 'danger' | 'warning'
  compact?: boolean
  bodyStyle?: React.CSSProperties
  style?: React.CSSProperties
}

export default function BentoCard({
  title,
  description,
  action,
  children,
  span = 12,
  tone = 'default',
  compact = false,
  bodyStyle,
  style,
}: BentoCardProps): JSX.Element {
  const className = [
    'pfa-bento-card',
    `pfa-span-${Math.max(1, Math.min(12, span))}`,
    compact ? 'compact' : '',
    tone !== 'default' ? (tone === 'accent' ? 'accent' : `tone-${tone}`) : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <section className={className} style={style}>
      {(title || action) && (
        <header style={styles.header}>
          <div style={styles.heading}>
            {title && <h3 style={styles.title}>{title}</h3>}
            {description && <p style={styles.description}>{description}</p>}
          </div>
          {action && <div style={styles.action}>{action}</div>}
        </header>
      )}
      <div className="pfa-bento-card-body" style={bodyStyle}>
        {children}
      </div>
    </section>
  )
}

const styles: Record<string, React.CSSProperties> = {
  header: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  heading: {
    minWidth: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.xxs,
  },
  title: {
    margin: 0,
    color: colors.text.primary,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    lineHeight: 1.35,
  },
  description: {
    margin: 0,
    color: colors.text.muted,
    fontSize: fontSize.sm,
    lineHeight: 1.45,
  },
  action: {
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
    gap: spacing.xs,
  },
}
