import React from 'react';
import { ErrorBoundary } from './ErrorBoundary';
import RecipeDetailPage from './RecipeDetailPage';

interface RecipeDetailPageWithErrorBoundaryProps {
  recipeId: string;
  className?: string;
}

const RecipeDetailErrorFallback: React.FC<{ error: Error; resetError: () => void }> = ({ error, resetError }) => (
  <div className="max-w-4xl mx-auto px-4 py-8">
    <div className="bg-red-50 border border-red-200 rounded-lg p-8 text-center">
      <svg 
        className="w-16 h-16 text-red-400 mx-auto mb-4" 
        fill="none" 
        stroke="currentColor" 
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          strokeWidth={2} 
          d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
        />
      </svg>
      
      <h2 className="text-xl font-semibold text-red-800 mb-2">
        Wystąpił błąd aplikacji
      </h2>
      
      <p className="text-red-700 mb-6">
        Przepraszamy, wystąpił nieoczekiwany błąd podczas ładowania widoku szczegółów przepisu.
      </p>
      
      <div className="bg-red-100 border border-red-300 rounded-lg p-4 mb-6">
        <p className="text-sm text-red-800 font-mono break-words">
          {error.message}
        </p>
      </div>
      
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <button
          onClick={resetError}
          className="inline-flex items-center px-4 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50 transition-colors duration-200"
        >
          <svg 
            className="w-4 h-4 mr-2" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" 
            />
          </svg>
          Odśwież widok
        </button>
        
        <button
          onClick={() => window.location.href = '/'}
          className="inline-flex items-center px-4 py-2 bg-gray-600 text-white font-medium rounded-lg hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-opacity-50 transition-colors duration-200"
        >
          <svg 
            className="w-4 h-4 mr-2" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" 
            />
          </svg>
          Strona główna
        </button>
      </div>
    </div>
  </div>
);

export default function RecipeDetailPageWithErrorBoundary({ 
  recipeId, 
  className = '' 
}: RecipeDetailPageWithErrorBoundaryProps) {
  const handleError = (error: Error, errorInfo: React.ErrorInfo) => {
    // Log error to monitoring service
    console.error('Recipe detail view error:', error, errorInfo);
    
    // In production, send to error reporting service
    if (process.env.NODE_ENV === 'production') {
      // Example: Sentry.captureException(error, { extra: errorInfo });
    }
  };

  return (
    <ErrorBoundary fallback={RecipeDetailErrorFallback} onError={handleError}>
      <RecipeDetailPage recipeId={recipeId} className={className} />
    </ErrorBoundary>
  );
} 