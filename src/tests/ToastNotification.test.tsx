import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ToastNotification, { ToastContainer } from '../components/ToastNotification';
import type { Toast, ToastType } from '../components/ToastNotification';

describe('ToastNotification', () => {
  const mockOnClose = vi.fn();

  const createMockToast = (type: ToastType = 'success', overrides: Partial<Toast> = {}): Toast => ({
    id: 'test-toast-1',
    type,
    title: 'Test Title',
    message: 'Test Message',
    duration: 5000,
    ...overrides
  });

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should render success toast correctly', () => {
    const toast = createMockToast('success');
    render(<ToastNotification toast={toast} onClose={mockOnClose} />);

    expect(screen.getByText('Test Title')).toBeInTheDocument();
    expect(screen.getByText('Test Message')).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveClass('bg-green-50', 'border-green-200');
    expect(screen.getByLabelText('Zamknij powiadomienie')).toBeInTheDocument();
  });

  it('should render error toast correctly', () => {
    const toast = createMockToast('error');
    render(<ToastNotification toast={toast} onClose={mockOnClose} />);

    expect(screen.getByRole('alert')).toHaveClass('bg-red-50', 'border-red-200');
    expect(screen.getByText('Test Title')).toHaveClass('text-red-800');
  });

  it('should render warning toast correctly', () => {
    const toast = createMockToast('warning');
    render(<ToastNotification toast={toast} onClose={mockOnClose} />);

    expect(screen.getByRole('alert')).toHaveClass('bg-yellow-50', 'border-yellow-200');
    expect(screen.getByText('Test Title')).toHaveClass('text-yellow-800');
  });

  it('should render info toast correctly', () => {
    const toast = createMockToast('info');
    render(<ToastNotification toast={toast} onClose={mockOnClose} />);

    expect(screen.getByRole('alert')).toHaveClass('bg-blue-50', 'border-blue-200');
    expect(screen.getByText('Test Title')).toHaveClass('text-blue-800');
  });

  it('should render toast without message', () => {
    const toast = createMockToast('success', { message: undefined });
    render(<ToastNotification toast={toast} onClose={mockOnClose} />);

    expect(screen.getByText('Test Title')).toBeInTheDocument();
    expect(screen.queryByText('Test Message')).not.toBeInTheDocument();
  });

  it('should render toast with action button', () => {
    const mockAction = vi.fn();
    const toast = createMockToast('error', {
      action: {
        label: 'Retry',
        onClick: mockAction
      }
    });

    render(<ToastNotification toast={toast} onClose={mockOnClose} />);

    const actionButton = screen.getByText('Retry');
    expect(actionButton).toBeInTheDocument();
    expect(actionButton).toHaveClass('underline');

    fireEvent.click(actionButton);
    expect(mockAction).toHaveBeenCalledOnce();
  });

  it('should call onClose when close button is clicked', () => {
    const toast = createMockToast();
    render(<ToastNotification toast={toast} onClose={mockOnClose} />);

    const closeButton = screen.getByLabelText('Zamknij powiadomienie');
    fireEvent.click(closeButton);

    // Should start exit animation and call onClose after 300ms
    vi.advanceTimersByTime(300);
    expect(mockOnClose).toHaveBeenCalledWith('test-toast-1');
  });

  it('should auto-close after duration', () => {
    const toast = createMockToast('success', { duration: 2000 });
    render(<ToastNotification toast={toast} onClose={mockOnClose} />);

    // Should start exit animation after 2000ms
    vi.advanceTimersByTime(2000);
    
    // Should call onClose after additional 300ms for exit animation
    vi.advanceTimersByTime(300);
    expect(mockOnClose).toHaveBeenCalledWith('test-toast-1');
  });

  it('should not auto-close when duration is 0', () => {
    const toast = createMockToast('error', { duration: 0 });
    render(<ToastNotification toast={toast} onClose={mockOnClose} />);

    vi.advanceTimersByTime(10000);
    expect(mockOnClose).not.toHaveBeenCalled();
  });

  it('should use default duration when not specified', () => {
    const toast = createMockToast('success', { duration: undefined });
    render(<ToastNotification toast={toast} onClose={mockOnClose} />);

    // Should use default 5000ms duration
    vi.advanceTimersByTime(5000);
    vi.advanceTimersByTime(300);
    expect(mockOnClose).toHaveBeenCalledWith('test-toast-1');
  });

  it('should have proper accessibility attributes', () => {
    const toast = createMockToast();
    render(<ToastNotification toast={toast} onClose={mockOnClose} />);

    const toastElement = screen.getByRole('alert');
    expect(toastElement).toHaveAttribute('aria-live', 'polite');
    
    const closeButton = screen.getByLabelText('Zamknij powiadomienie');
    expect(closeButton).toBeInTheDocument();
  });

  it('should display correct icons for each toast type', () => {
    const toastTypes: ToastType[] = ['success', 'error', 'warning', 'info'];
    
    toastTypes.forEach((type) => {
      const { unmount } = render(
        <ToastNotification toast={createMockToast(type)} onClose={mockOnClose} />
      );
      
      // Each type should have an SVG icon
      const icon = screen.getByRole('alert').querySelector('svg');
      expect(icon).toBeInTheDocument();
      
      unmount();
    });
  });

  it('should handle rapid open/close correctly', () => {
    const toast = createMockToast();
    const { rerender } = render(<ToastNotification toast={toast} onClose={mockOnClose} />);

    // Simulate rapid close click
    const closeButton = screen.getByLabelText('Zamknij powiadomienie');
    fireEvent.click(closeButton);
    fireEvent.click(closeButton); // Second click

    vi.advanceTimersByTime(300);
    // Should only call onClose once
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });
});

describe('ToastContainer', () => {
  const mockOnClose = vi.fn();

  const createToasts = (): Toast[] => [
    {
      id: 'toast-1',
      type: 'success',
      title: 'Success Toast',
      message: 'Success message',
      duration: 5000
    },
    {
      id: 'toast-2',
      type: 'error',
      title: 'Error Toast',
      message: 'Error message',
      duration: 7000
    },
    {
      id: 'toast-3',
      type: 'warning',
      title: 'Warning Toast',
      duration: 5000
    }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render empty container when no toasts', () => {
    const { container } = render(<ToastContainer toasts={[]} onClose={mockOnClose} />);
    
    const toastContainer = container.querySelector('.fixed.top-4.right-4');
    expect(toastContainer).toBeInTheDocument();
    expect(toastContainer?.children).toHaveLength(0);
  });

  it('should render multiple toasts', () => {
    const toasts = createToasts();
    render(<ToastContainer toasts={toasts} onClose={mockOnClose} />);

    expect(screen.getByText('Success Toast')).toBeInTheDocument();
    expect(screen.getByText('Error Toast')).toBeInTheDocument();
    expect(screen.getByText('Warning Toast')).toBeInTheDocument();
  });

  it('should position container correctly', () => {
    const toasts = createToasts();
    const { container } = render(<ToastContainer toasts={toasts} onClose={mockOnClose} />);
    
    const toastContainer = container.querySelector('.fixed.top-4.right-4.z-50');
    expect(toastContainer).toBeInTheDocument();
    expect(toastContainer).toHaveClass('space-y-3');
  });

  it('should pass onClose to each toast', () => {
    const toasts = createToasts();
    render(<ToastContainer toasts={toasts} onClose={mockOnClose} />);

    const closeButtons = screen.getAllByLabelText('Zamknij powiadomienie');
    expect(closeButtons).toHaveLength(3);

    // Click first toast's close button
    fireEvent.click(closeButtons[0]);
    
    vi.useFakeTimers();
    vi.advanceTimersByTime(300);
    expect(mockOnClose).toHaveBeenCalledWith('toast-1');
    vi.useRealTimers();
  });

  it('should maintain toast order', () => {
    const toasts = createToasts();
    render(<ToastContainer toasts={toasts} onClose={mockOnClose} />);

    const toastElements = screen.getAllByRole('alert');
    expect(toastElements).toHaveLength(3);
    
    // Check order by checking the title text in each toast
    const titles = toastElements.map(toast => 
      toast.querySelector('.font-medium')?.textContent
    );
    expect(titles).toEqual(['Success Toast', 'Error Toast', 'Warning Toast']);
  });

  it('should handle dynamic toast updates', () => {
    const initialToasts = [createToasts()[0]];
    const { rerender } = render(
      <ToastContainer toasts={initialToasts} onClose={mockOnClose} />
    );

    expect(screen.getByText('Success Toast')).toBeInTheDocument();
    expect(screen.queryByText('Error Toast')).not.toBeInTheDocument();

    // Add another toast
    const updatedToasts = createToasts().slice(0, 2);
    rerender(<ToastContainer toasts={updatedToasts} onClose={mockOnClose} />);

    expect(screen.getByText('Success Toast')).toBeInTheDocument();
    expect(screen.getByText('Error Toast')).toBeInTheDocument();

    // Remove first toast
    const finalToasts = [updatedToasts[1]];
    rerender(<ToastContainer toasts={finalToasts} onClose={mockOnClose} />);

    expect(screen.queryByText('Success Toast')).not.toBeInTheDocument();
    expect(screen.getByText('Error Toast')).toBeInTheDocument();
  });

  it('should handle toasts with different types correctly', () => {
    const toasts = createToasts();
    render(<ToastContainer toasts={toasts} onClose={mockOnClose} />);

    const alerts = screen.getAllByRole('alert');
    expect(alerts[0]).toHaveClass('bg-green-50'); // success
    expect(alerts[1]).toHaveClass('bg-red-50');   // error
    expect(alerts[2]).toHaveClass('bg-yellow-50'); // warning
  });
}); 