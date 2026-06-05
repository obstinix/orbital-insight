import { Component, ReactNode } from 'react'

interface Props { children: ReactNode; fallbackName?: string }
interface State { error: Error | null; info: string }

export class EngineErrorBoundary extends Component<Props, State> {
  state: State = { error: null, info: '' }

  static getDerivedStateFromError(error: Error): State {
    return { error, info: '' }
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[EngineErrorBoundary] Caught error:', error)
    console.error('[EngineErrorBoundary] Component stack:', info.componentStack)
    this.setState({ info: info.componentStack ?? '' })
  }

  render() {
    if (this.state.error) {
      return (
        <div style={{
          position: 'fixed', inset: 0,
          background: '#050510',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          fontFamily: 'monospace', color: '#ff6b6b',
          padding: '2rem', gap: '1.5rem',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: '2.5rem' }}>🌌</div>
          <h2 style={{ margin: 0, fontSize: '1.2rem' }}>Engine crashed before first render</h2>
          <pre style={{
            background: '#0a0a1a',
            padding: '1.5rem',
            borderRadius: '8px',
            border: '1px solid #ff6b6b44',
            maxWidth: '700px',
            width: '100%',
            textAlign: 'left',
            fontSize: '12px',
            color: '#ffaaaa',
            overflowX: 'auto',
            whiteSpace: 'pre-wrap',
          }}>
            {this.state.error.message}
            {'\n\n'}
            {this.state.error.stack?.split('\n').slice(0,8).join('\n')}
          </pre>
          <details style={{ maxWidth: '700px', width: '100%', color: '#666' }}>
            <summary style={{ cursor: 'pointer', color: '#8888aa', fontSize: '12px' }}>Component stack</summary>
            <pre style={{ fontSize: '11px', marginTop: '0.5rem', textAlign: 'left', whiteSpace: 'pre-wrap' }}>
              {this.state.info}
            </pre>
          </details>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: '8px 24px',
              background: 'transparent',
              border: '1px solid #ff6b6b',
              color: '#ff6b6b',
              borderRadius: '6px',
              cursor: 'pointer',
              fontFamily: 'monospace',
              fontSize: '13px',
            }}
          >
            Reload
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
