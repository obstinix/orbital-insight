import { Component, ReactNode } from 'react';

interface Props { children: ReactNode; fallbackName?: string }
interface State { error: Error | null }

export class EngineErrorBoundary extends Component<Props, State> {
  override state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  override render() {
    if (this.state.error) {
      return (
        <div style={{
          position: 'fixed', inset: 0,
          background: '#0a0a0f',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'monospace', color: '#ff6b6b',
          flexDirection: 'column', gap: '1rem', padding: '2rem',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '3rem' }}>🌌</div>
          <h2 style={{ margin: 0 }}>{this.props.fallbackName ?? '3D Engine'} failed to initialize</h2>
          <pre style={{ color: '#ffa07a', maxWidth: '600px', whiteSpace: 'pre-wrap', fontSize: '12px' }}>
            {this.state.error.message}
          </pre>
          <p style={{ color: '#666', fontSize: '13px' }}>
            Check DevTools console (F12) for the full stack trace.
            <br />Common fixes: enable hardware acceleration in your browser, or try a different browser.
          </p>
          <button
            onClick={() => this.setState({ error: null })}
            style={{ padding: '8px 20px', background: 'transparent', border: '1px solid #ff6b6b', color: '#ff6b6b', borderRadius: '6px', cursor: 'pointer', marginTop: '0.5rem' }}
          >
            Retry
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
