import { colors, fontSize, fontWeight, spacing } from '../../core/utils/styles'

interface PageHeaderProps {
  title: string
  description?: string
  actions?: React.ReactNode
}

export default function PageHeader({ title, description, actions }: PageHeaderProps): JSX.Element {
  return (
    <header style={styles.header}>
      <div style={styles.heading}>
        <h1 style={styles.title}>{title}</h1>
        {description && <p style={styles.description}>{description}</p>}
      </div>
      {actions && <div style={styles.actions}>{actions}</div>}
    </header>
  )
}

const styles: Record<string, React.CSSProperties> = {
  header: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.lg,
    marginBottom: spacing.xl,
    flexWrap: 'wrap',
  },
  heading: {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.xs,
    minWidth: 0,
  },
  title: {
    margin: 0,
    color: colors.text.primary,
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.semibold,
    lineHeight: 1.25,
  },
  description: {
    margin: 0,
    color: colors.text.muted,
    fontSize: fontSize.md,
    lineHeight: 1.5,
  },
  actions: {
    display: 'flex',
    alignItems: 'center',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
}
