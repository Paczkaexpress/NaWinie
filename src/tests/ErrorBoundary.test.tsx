import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ErrorBoundary, { RecipeErrorBoundary, withErrorBoundary } from '../components/ErrorBoundary';
import React from 'react';

// Test component that throws an error
const ThrowError: React.FC<{ shouldThrow?: boolean; error?: Error }> = ({ 
  shouldThrow = true, 
  error = new Error('Test error') 
}) => {
  if (shouldThrow) {
    throw error;
  }
  return <div>No error</div>;
};

// Test component that doesn't throw
const SafeComponent: React.FC = () => <div>Safe component</div>;

// Mock console.error to avoid noise in tests
const originalConsoleError = console.error;
beforeEach(() => {
  console.error = vi.fn();
});

afterEach(() => {
  console.error = originalConsoleError;
});

// Mock window methods
const mockReload = vi.fn();
const mockBack = vi.fn();
Object.defineProperty(window, 'location', {
  value: { reload: mockReload },
  writable: true
});
Object.defineProperty(window, 'history', {
  value: { back: mockBack },
  writable: true
});

describe('ErrorBoundary', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render children when no error occurs', () => {
    render(
      <ErrorBoundary>
        <SafeComponent />
      </ErrorBoundary>
    );

    expect(screen.getByText('Safe component')).toBeInTheDocument();
  });

  it('should catch and display error with default fallback', () => {
    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    );

    expect(screen.getByText('Ups! Coś poszło nie tak')).toBeInTheDocument();
    expect(screen.getByText('Wystąpił nieoczekiwany błąd w aplikacji. Przepraszamy za niedogodności.')).toBeInTheDocument();
    expect(screen.getByText('Spróbuj ponownie')).toBeInTheDocument();
    expect(screen.getByText('Odśwież stronę')).toBeInTheDocument();
    expect(screen.getByText('Wróć')).toBeInTheDocument();
  });

  it('should display custom fallback when provided', () => {
    const CustomFallback = <div>Custom error message</div>;
    
    render(
      <ErrorBoundary fallback={CustomFallback}>
        <ThrowError />
      </ErrorBoundary>
    );

    expect(screen.getByText('Custom error message')).toBeInTheDocument();
    expect(screen.queryByText('Ups! Coś poszło nie tak')).not.toBeInTheDocument();
  });

  it('should call onError callback when error occurs', () => {
    const mockOnError = vi.fn();
    
    render(
      <ErrorBoundary onError={mockOnError}>
        <ThrowError />
      </ErrorBoundary>
    );

    expect(mockOnError).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({
        componentStack: expect.any(String)
      })
    );
  });

  it('should handle retry button click', () => {
    const { rerender } = render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText('Ups! Coś poszło nie tak')).toBeInTheDocument();

    // Click retry button
    fireEvent.click(screen.getByText('Spróbuj ponownie'));

    // Re-render with no error
    rerender(
      <ErrorBoundary>
        <ThrowError shouldThrow={false} />
      </ErrorBoundary>
    );

    expect(screen.getByText('No error')).toBeInTheDocument();
  });

  it('should handle reload button click', () => {
    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    );

    fireEvent.click(screen.getByText('Odśwież stronę'));
    expect(mockReload).toHaveBeenCalledOnce();
  });

  it('should handle back button click', () => {
    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    );

    fireEvent.click(screen.getByText('Wróć'));
    expect(mockBack).toHaveBeenCalledOnce();
  });

  it('should have proper accessibility attributes', () => {
    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    );

    const errorContainer = screen.getByRole('alert');
    expect(errorContainer).toHaveAttribute('aria-live', 'polite');
    
    const buttons = screen.getAllByRole('button');
    buttons.forEach(button => {
      expect(button).toHaveAttribute('aria-label');
    });
  });

  it('should show error details in development mode', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';

    const testError = new Error('Detailed test error');
    testError.stack = 'Error: Detailed test error\n    at TestComponent\n    at ErrorBoundary';

    render(
      <ErrorBoundary>
        <ThrowError error={testError} />
      </ErrorBoundary>
    );

    // Should have details section in development
    const detailsElement = screen.getByText('Szczegóły błędu (tryb deweloperski)');
    expect(detailsElement).toBeInTheDocument();

    process.env.NODE_ENV = originalEnv;
  });

  it('should not show error details in production mode', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';

    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    );

    expect(screen.queryByText('Szczegóły błędu')).not.toBeInTheDocument();

    process.env.NODE_ENV = originalEnv;
  });

  it('should display contact information', () => {
    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    );

    const contactLink = screen.getByText('działem wsparcia technicznego');
    expect(contactLink).toBeInTheDocument();
    expect(contactLink).toHaveAttribute('href', 'mailto:support@nawinie.pl');
  });

  it('should reset error state when component unmounts and remounts', () => {
    const { unmount, rerender } = render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    );

    expect(screen.getByText('Ups! Coś poszło nie tak')).toBeInTheDocument();

    unmount();

    rerender(
      <ErrorBoundary>
        <SafeComponent />
      </ErrorBoundary>
    );

    expect(screen.getByText('Safe component')).toBeInTheDocument();
  });
});

describe('RecipeErrorBoundary', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render children when no error occurs', () => {
    render(
      <RecipeErrorBoundary recipeName="Test Recipe">
        <SafeComponent />
      </RecipeErrorBoundary>
    );

    expect(screen.getByText('Safe component')).toBeInTheDocument();
  });

  it('should display recipe-specific error fallback', () => {
    render(
      <RecipeErrorBoundary recipeName="Test Recipe">
        <ThrowError />
      </RecipeErrorBoundary>
    );

    expect(screen.getByText('Błąd ładowania przepisu')).toBeInTheDocument();
    expect(screen.getByText('Wystąpił problem z ładowaniem przepisu "Test Recipe".')).toBeInTheDocument();
    expect(screen.getByText('Odśwież stronę')).toBeInTheDocument();
    expect(screen.getByText('Wróć')).toBeInTheDocument();
  });

  it('should display generic message when no recipe name provided', () => {
    render(
      <RecipeErrorBoundary>
        <ThrowError />
      </RecipeErrorBoundary>
    );

    expect(screen.getByText('Wystąpił problem z ładowaniem przepisu.')).toBeInTheDocument();
  });

  it('should have proper accessibility attributes', () => {
    render(
      <RecipeErrorBoundary recipeName="Test Recipe">
        <ThrowError />
      </RecipeErrorBoundary>
    );

    const errorContainer = screen.getByRole('alert');
    expect(errorContainer).toHaveAttribute('aria-live', 'polite');
  });

  it('should handle reload and back buttons', () => {
    render(
      <RecipeErrorBoundary recipeName="Test Recipe">
        <ThrowError />
      </RecipeErrorBoundary>
    );

    fireEvent.click(screen.getByText('Odśwież stronę'));
    expect(mockReload).toHaveBeenCalledOnce();

    fireEvent.click(screen.getByText('Wróć'));
    expect(mockBack).toHaveBeenCalledOnce();
  });

  it('should log recipe-specific error context', () => {
    const consoleSpy = vi.spyOn(console, 'error');
    const testError = new Error('Recipe loading failed');

    render(
      <RecipeErrorBoundary recipeName="Test Recipe">
        <ThrowError error={testError} />
      </RecipeErrorBoundary>
    );

    expect(consoleSpy).toHaveBeenCalledWith(
      'Recipe component error:',
      expect.objectContaining({
        recipeName: 'Test Recipe',
        error: 'Recipe loading failed'
      })
    );
  });
});

describe('withErrorBoundary HOC', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should wrap component with error boundary', () => {
    const WrappedComponent = withErrorBoundary(SafeComponent);
    
    render(<WrappedComponent />);
    expect(screen.getByText('Safe component')).toBeInTheDocument();
  });

  it('should catch errors in wrapped component', () => {
    const WrappedComponent = withErrorBoundary(ThrowError);
    
    render(<WrappedComponent />);
    expect(screen.getByText('Ups! Coś poszło nie tak')).toBeInTheDocument();
  });

  it('should use custom fallback when provided', () => {
    const CustomFallback = <div>HOC custom fallback</div>;
    const WrappedComponent = withErrorBoundary(ThrowError, CustomFallback);
    
    render(<WrappedComponent />);
    expect(screen.getByText('HOC custom fallback')).toBeInTheDocument();
  });

  it('should call custom onError when provided', () => {
    const mockOnError = vi.fn();
    const WrappedComponent = withErrorBoundary(ThrowError, undefined, mockOnError);
    
    render(<WrappedComponent />);
    
    expect(mockOnError).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({
        componentStack: expect.any(String)
      })
    );
  });

  it('should preserve component display name', () => {
    const TestComponent = () => <div>test</div>;
    TestComponent.displayName = 'TestComponent';
    
    const WrappedComponent = withErrorBoundary(TestComponent);
    expect(WrappedComponent.displayName).toBe('withErrorBoundary(TestComponent)');
  });

  it('should use component name when displayName not available', () => {
    function TestFunction() {
      return <div>test</div>;
    }
    
    const WrappedComponent = withErrorBoundary(TestFunction);
    expect(WrappedComponent.displayName).toBe('withErrorBoundary(TestFunction)');
  });

  it('should pass props to wrapped component', () => {
    const PropsComponent: React.FC<{ testProp: string }> = ({ testProp }) => (
      <div>{testProp}</div>
    );
    
    const WrappedComponent = withErrorBoundary(PropsComponent);
    
    render(<WrappedComponent testProp="test value" />);
    expect(screen.getByText('test value')).toBeInTheDocument();
  });
}); 