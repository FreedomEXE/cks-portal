import React from 'react';

type Props = { children: React.ReactNode };
type State = { hasError: boolean; error?: any };

export default class AdminErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }

  componentDidCatch(error: any, info: any) {
    // eslint-disable-next-line no-console
    console.error('[AdminErrorBoundary] error:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ minHeight: '100vh', background: '#000', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ maxWidth: 800, padding: 24 }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>⚠️ Admin Hub Error</div>
            <div style={{ fontSize: 14, opacity: 0.9, whiteSpace: 'pre-wrap' }}>
              {String(this.state.error?.message || this.state.error)}
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

