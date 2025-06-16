import React, { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  onRetry?: () => void;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('ErrorBoundary caught an error:', error, errorInfo);
    }

    // Update state with error info
    this.setState({
      error,
      errorInfo
    });

    // Call onError callback if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Here you could also log the error to an error reporting service
    // logErrorToService(error, errorInfo);
  }

  handleRetry = () => {
    this.props.onRetry?.();
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default fallback UI
      return (
        <div 
          className="min-h-screen flex items-center justify-center bg-gray-50 animate-fadeIn"
          role="alert"
          aria-live="polite"
        >
          <div className="max-w-md w-full mx-4">
            <div className="bg-white rounded-lg shadow-lg p-8 text-center">
              {/* Error Icon */}
              <div className="mb-6">
                <svg 
                  className="w-16 h-16 mx-auto text-red-500" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 16.5c-.77.833.192 2.5 1.732 2.5z" 
                  />
                </svg>
              </div>

              {/* Error Message */}
              <h1 className="text-2xl font-bold text-gray-900 mb-4">
                Ups! Coś poszło nie tak
              </h1>
              <p className="text-gray-600 mb-6">
                Wystąpił nieoczekiwany błąd w aplikacji. Przepraszamy za niedogodności.
              </p>

              {/* Error Details (only in development) */}
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <details className="mb-6 text-left">
                  <summary className="cursor-pointer text-sm font-MEDIUM text-gray-700 hover:text-gray-900">
                    Szczegóły błędu (tryb deweloperski)
                  </summary>
                  <div className="mt-2 p-4 bg-gray-100 rounded text-xs font-mono text-gray-800 overflow-auto max-h-40">
                    <div className="mb-2">
                      <strong>Błąd:</strong> {this.state.error.message}
                    </div>
                    <div className="mb-2">
                      <strong>Stack:</strong>
                      <pre className="whitespace-pre-wrap">{this.state.error.stack}</pre>
                    </div>
                    {this.state.errorInfo && (
                      <div>
                        <strong>Component Stack:</strong>
                        <pre className="whitespace-pre-wrap">{this.state.errorInfo.componentStack}</pre>
                      </div>
                    )}
                  </div>
                </details>
              )}

              {/* Action Buttons */}
              <div className="space-y-3">
                <button
                  onClick={this.handleRetry}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-MEDIUM py-3 px-6 rounded-lg transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  aria-label="Spróbuj ponownie załadować komponent"
                >
                  Spróbuj ponownie
                </button>
                <button
                  onClick={this.handleReload}
                  className="w-full bg-gray-600 hover:bg-gray-700 text-white font-MEDIUM py-3 px-6 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                  aria-label="Odśwież całą stronę"
                >
                  Odśwież stronę
                </button>
                <button
                  onClick={() => window.history.back()}
                  className="w-full text-gray-600 hover:text-gray-800 font-MEDIUM py-2 px-4 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                  aria-label="Wróć do poprzedniej strony"
                >
                  Wróć
                </button>
              </div>

              {/* Contact Info */}
              <div className="mt-6 text-sm text-gray-500">
                <p>
                  Jeśli problem się powtarza, skontaktuj się z{' '}
                  <a 
                    href="mailto:support@nawinie.pl" 
                    className="text-blue-600 hover:text-blue-800 underline focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded"
                  >
                    działem wsparcia technicznego
                  </a>
                </p>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// HOC for wrapping components with error boundary
export const withErrorBoundary = <P extends object>(
  Component: React.ComponentType<P>,
  fallback?: ReactNode,
  onError?: (error: Error, errorInfo: ErrorInfo) => void
) => {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary fallback={fallback} onError={onError}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
};

// Specific error boundary for recipe components
interface RecipeErrorBoundaryProps {
  children: ReactNode;
  recipeName?: string;
}

export const RecipeErrorBoundary: React.FC<RecipeErrorBoundaryProps> = ({ 
  children, 
  recipeName 
}) => {
  const handleError = (error: Error, errorInfo: ErrorInfo) => {
    // Log recipe-specific error context
    console.error('Recipe component error:', {
      recipeName,
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack
    });
  };

  const fallback = (
    <div 
      className="bg-red-50 border border-red-200 rounded-lg p-6 text-center animate-fadeIn"
      role="alert"
      aria-live="polite"
    >
      <div className="mb-4">
        <svg 
          className="w-12 h-12 mx-auto text-red-400" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 16.5c-.77.833.192 2.5 1.732 2.5z" 
          />
        </svg>
      </div>
      <h3 className="text-lg font-semibold text-red-800 mb-2">
        Błąd ładowania przepisu
      </h3>
      <p className="text-red-600 mb-4">
        {recipeName 
          ? `Wystąpił problem z ładowaniem przepisu "${recipeName}".`
          : 'Wystąpił problem z ładowaniem przepisu.'
        }
      </p>
      <div className="space-x-3">
        <button
          onClick={() => window.location.reload()}
          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
        >
          Odśwież stronę
        </button>
        <button
          onClick={() => window.history.back()}
          className="text-red-600 hover:text-red-800 px-4 py-2 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
        >
          Wróć
        </button>
      </div>
    </div>
  );

  return (
    <ErrorBoundary fallback={fallback} onError={handleError}>
      {children}
    </ErrorBoundary>
  );
};

export default ErrorBoundary; 