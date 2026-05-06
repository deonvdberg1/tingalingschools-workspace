import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('ErrorBoundary caught:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{padding: 40, textAlign: 'center'}}>
          <h2 style={{color: '#e53e3e', marginBottom: 16}}>Something went wrong</h2>
          <p style={{color: '#718096', marginBottom: 8}}>{this.state.error?.message}</p>
          <pre style={{fontSize: 12, color: '#a0aec0', maxWidth: 600, margin: '0 auto', textAlign: 'left', overflow: 'auto'}}>
            {this.state.error?.stack}
          </pre>
          <a href="/" style={{display: 'inline-block', marginTop: 16, padding: '8px 24px', background: '#319795', color: 'white', borderRadius: 8, textDecoration: 'none'}}>
            Back to Home
          </a>
        </div>
      );
    }
    return this.props.children;
  }
}
