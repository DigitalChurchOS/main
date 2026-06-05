import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: React.ComponentType<{ error: Error }>;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class RenderErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Runtime crash in slot rendering boundary:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError && this.state.error) {
      if (this.props.fallback) {
        return React.createElement(this.props.fallback, { error: this.state.error });
      }
      return React.createElement(
        'div',
        { className: 'p-4 border border-red-200 bg-red-50 text-red-700 rounded-md font-sans text-sm' },
        React.createElement('div', { className: 'font-semibold' }, '⚠️ Rendering Error'),
        React.createElement('pre', { className: 'text-xs mt-1 text-red-500 overflow-auto' }, this.state.error.message)
      );
    }

    return this.props.children;
  }
}
