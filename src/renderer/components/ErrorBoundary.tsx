import { Component, ErrorInfo, ReactNode } from 'react'

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
  container: { padding: '48px', textAlign: 'center' },
  title: { fontSize: '20px', fontWeight: 600, color: '#dc3545' },
  text: { fontSize: '14px', color: '#666', margin: '8px 0 16px' },
  button: {
    padding: '8px 16px',
    fontSize: '14px',
    color: '#fff',
    backgroundColor: '#4A90D9',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer'
  }
}

export default ErrorBoundary
