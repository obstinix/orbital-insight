import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children?: ReactNode;
  fallback?: ReactNode | ((error: Error | null, reset: () => void) => ReactNode);
  name?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error(`[ErrorBoundary - ${this.props.name || 'System'}]:`, error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        if (typeof this.props.fallback === 'function') {
          return (this.props.fallback as any)(this.state.error, this.handleReset);
        }
        return this.props.fallback;
      }

      return (
        <div
          role="alert"
          style={{
            padding: '1.5rem',
            background: 'rgba(20, 10, 10, 0.85)',
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(255, 59, 48, 0.4)',
            borderRadius: '8px',
            color: '#fff',
            fontFamily: 'var(--font-mono, monospace)',
            maxWidth: '400px',
            boxShadow: '0 8px 32px rgba(255, 0, 0, 0.25)',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.8rem',
            animation: 'fadeIn var(--duration-medium) ease',
            margin: '10px'
          }}
        >
          <div style={{ color: '#ff3b30', fontSize: '0.65rem', letterSpacing: '1.5px', fontWeight: 'bold' }}>
            [SYSTEM FAULT: {this.props.name?.toUpperCase() || 'CORE'}]
          </div>
          <h3 style={{ margin: 0, fontSize: '1.1rem', fontFamily: 'var(--font-display, sans-serif)', color: '#fff' }}>
            Telemetry Link Blocked
          </h3>
          <p style={{ fontSize: '0.75rem', color: 'rgba(255, 255, 255, 0.7)', lineHeight: '1.4', margin: 0 }}>
            An exception occurred within this module. System link severed.
          </p>
          {this.state.error && (
            <pre style={{
              background: 'rgba(0, 0, 0, 0.4)',
              padding: '0.5rem',
              borderRadius: '4px',
              fontSize: '0.65rem',
              overflowX: 'auto',
              border: '1px solid rgba(255, 59, 48, 0.2)',
              color: '#ff8888',
              margin: 0
            }}>
              {this.state.error.message}
            </pre>
          )}
          <button
            onClick={this.handleReset}
            style={{
              background: 'rgba(255, 59, 48, 0.1)',
              border: '1px solid rgba(255, 59, 48, 0.5)',
              color: '#ff5b50',
              padding: '0.4rem 0.8rem',
              borderRadius: '4px',
              cursor: 'pointer',
              fontFamily: 'var(--font-mono, monospace)',
              fontSize: '0.7rem',
              transition: 'all 0.15s ease',
              textTransform: 'uppercase',
              alignSelf: 'flex-start'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = 'rgba(255, 59, 48, 0.2)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = 'rgba(255, 59, 48, 0.1)';
            }}
          >
            Re-engage Link
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
