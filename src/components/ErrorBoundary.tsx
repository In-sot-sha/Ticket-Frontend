import React, { ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorId?: number; // ID from database
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log to console in development
    console.error('ErrorBoundary caught:', error, errorInfo);

    // Send crash report to backend
    this.reportError(error, errorInfo);
  }

  reportError = async (error: Error, errorInfo: React.ErrorInfo) => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:33312'}/api/errors/report`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message: error.message,
            stack: error.stack,
            type: 'ERROR',
            severity: 'HIGH',
            userAgent: navigator.userAgent,
            url: window.location.href,
            context: {
              componentStack: errorInfo.componentStack,
            },
          }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        // Store error ID for reference
        this.setState({ errorId: data.errorId });
      }
    } catch (err) {
      // Silently fail - don't want to crash while trying to report crash
      console.error('Failed to report error:', err);
    }
  };

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
    });
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-white dark:bg-gray-950 flex items-center justify-center px-4">
          <div className="max-w-md w-full text-center">
            <div className="mb-6 flex justify-center">
              <div className="bg-red-100 dark:bg-red-900/20 rounded-full p-4">
                <AlertTriangle className="h-8 w-8 text-red-600 dark:text-red-400" />
              </div>
            </div>

            <h1 className="text-2xl font-extrabold text-neutral-900 dark:text-white mb-2">
              Something went wrong
            </h1>

            <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-6">
              We encountered an unexpected error. Our team has been notified. Try refreshing the page or returning home.
            </p>

            {this.state.errorId && (
              <div className="mb-6 p-3 bg-blue-50 dark:bg-blue-900/10 rounded-lg border border-blue-200 dark:border-blue-900">
                <p className="text-xs text-blue-800 dark:text-blue-200">
                  <span className="font-semibold">Reference ID:</span> #{this.state.errorId}
                </p>
              </div>
            )}

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div className="mb-6 p-3 bg-red-50 dark:bg-red-900/10 rounded-lg border border-red-200 dark:border-red-900 text-left">
                <p className="text-xs font-mono text-red-800 dark:text-red-200 break-words">
                  {this.state.error.message}
                </p>
              </div>
            )}

            <button
              onClick={this.handleReset}
              className="inline-flex items-center gap-2 bg-rose-500 hover:bg-rose-600 text-white font-semibold px-6 py-3 rounded-full transition-colors"
            >
              <RefreshCw className="h-4 w-4" />
              Go to Home
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
