import React, { ReactNode } from 'react';
import { logError } from '@/utils/errorHandler';

/**
 * Props for ErrorBoundary component
 */
export interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode | ((error: Error, retry: () => void) => ReactNode);
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

/**
 * State for ErrorBoundary component
 */
interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * Error Boundary component for catching React component errors
 *
 * Features:
 * - Catches errors in child components
 * - Displays fallback UI on error
 * - Logs errors for debugging
 * - Provides retry mechanism
 * - Maintains error state
 *
 * @example
 * ```typescript
 * <ErrorBoundary
 *   fallback={(error, retry) => (
 *     <div>
 *       <p>Something went wrong: {error.message}</p>
 *       <button onClick={retry}>Try again</button>
 *     </div>
 *   )}
 * >
 *   <YourComponent />
 * </ErrorBoundary>
 * ```
 */
export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  /**
   * Update state to trigger fallback UI
   */
  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error,
    };
  }

  /**
   * Log error details
   */
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    logError(error, {
      componentStack: errorInfo.componentStack,
      errorBoundary: true,
    });

    this.props.onError?.(error, errorInfo);
  }

  /**
   * Reset error state
   */
  handleRetry = (): void => {
    this.setState({
      hasError: false,
      error: null,
    });
  };

  /**
   * Render method - display error fallback or children
   */
  render(): ReactNode {
    if (this.state.hasError && this.state.error) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        if (typeof this.props.fallback === 'function') {
          return this.props.fallback(this.state.error, this.handleRetry);
        }
        return this.props.fallback;
      }

      // Default fallback UI
      return (
        <div
          style={{
            padding: '20px',
            textAlign: 'center',
            backgroundColor: '#fee',
            border: '1px solid #fcc',
            borderRadius: '4px',
            margin: '20px',
          }}
        >
          <h2>Something went wrong</h2>
          <p>{this.state.error.message}</p>
          <button
            onClick={this.handleRetry}
            style={{
              padding: '10px 20px',
              backgroundColor: '#f44336',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            Try again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
