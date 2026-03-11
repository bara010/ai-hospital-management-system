import { Component } from 'react';

export default class AppErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error) {
    return {
      hasError: true,
      message: error?.message || 'Unexpected frontend error',
    };
  }

  componentDidCatch(error) {
    // Keep console visibility for debugging while avoiding blank screens.
    // eslint-disable-next-line no-console
    console.error('HOSPITO frontend crash:', error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '2rem', fontFamily: 'Nunito Sans, sans-serif' }}>
          <h2>HOSPITO frontend error</h2>
          <p>The UI crashed. Please refresh once (Ctrl+F5).</p>
          <p style={{ color: '#c93a3a' }}>{this.state.message}</p>
        </div>
      );
    }

    return this.props.children;
  }
}
