import { Component, type ErrorInfo, type ReactNode } from 'react';

import { ErrorFallback } from './ErrorFallback';

export interface ErrorBoundaryProps {
  children: ReactNode;
  /** Report to Sentry / the logger (6.3). */
  onError?: (error: Error, info: ErrorInfo) => void;
  /** Custom fallback; defaults to the platform ErrorFallback (5.2). */
  fallback?: (props: { error: Error; reset: () => void }) => ReactNode;
  /** Translated strings — ui has no i18n dependency. */
  labels?: { title: string; retry: string };
}

/** 5.2 — Shared error boundary with platform-specific fallbacks. */
export class ErrorBoundary extends Component<ErrorBoundaryProps, { error: Error | null }> {
  override state = { error: null as Error | null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  override componentDidCatch(error: Error, info: ErrorInfo) {
    this.props.onError?.(error, info);
  }

  reset = () => this.setState({ error: null });

  override render() {
    const { error } = this.state;
    if (!error) return this.props.children;
    if (this.props.fallback) return this.props.fallback({ error, reset: this.reset });
    return (
      <ErrorFallback
        error={error}
        reset={this.reset}
        labels={this.props.labels ?? { title: 'Something went wrong', retry: 'Try again' }}
      />
    );
  }
}
