import { Component, ErrorInfo, ReactNode } from 'react'
import { colors, fontSize, fontWeight, spacing } from '../../core/utils/styles'
import { uiStyles } from '../uiStyles'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('ErrorBoundary caught:', error, errorInfo)
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        this.props.fallback ?? (
          <div style={styles.container}>
            <h2 style={styles.title}>Something went wrong</h2>
            <p style={styles.text}>{this.state.error?.message ?? 'Unknown error'}</p>
            <button
              style={styles.button}
              onClick={() => this.setState({ hasError: false, error: undefined })}
            >
              Try again
            </button>
          </div>
        )
      )
    }
    return this.props.children
  }
}

const styles: Record<string, React.CSSProperties> = {
  container: { padding: spacing.huge, textAlign: 'center' },
  title: { fontSize: fontSize.xl, fontWeight: fontWeight.semibold, color: colors.text.error },
  text: { fontSize: fontSize.base, color: colors.text.muted, margin: `${spacing.sm} 0 ${spacing.lg}` },
  button: uiStyles.button,
}

export default ErrorBoundary
