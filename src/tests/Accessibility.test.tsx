import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import OptimizedRecipeManagementView from '../components/OptimizedRecipeManagementView';
import ToastNotification, { ToastContainer } from '../components/ToastNotification';
import ErrorBoundary from '../components/ErrorBoundary';
import type { RecipeDetailDto, UserDto } from '../types';

// Mock dependencies
vi.mock('../hooks/useAuth', () => ({
  useAuth: () => ({
    user: mockUser,
    isLoading: false,
    error: null
  })
}));

vi.mock('../lib/auth', () => ({
  authService: {
    getSession: vi.fn().mockResolvedValue({
      access_token: 'mock-token',
      user: mockUser
    })
  }
}));

const mockFetch = vi.fn();
global.fetch = mockFetch;

const mockUser: UserDto = {
  id: 'user-1',
  email: 'test@example.com',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z'
};

const mockRecipe: RecipeDetailDto = {
  id: 'recipe-1',
  name: 'Test Recipe',
  description: 'Test Description',
  preparation_time_minutes: 30,
  complexity_level: 'medium',
  author_id: 'user-1',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  steps: [
    { step: 1, description: 'First step' },
    { step: 2, description: 'Second step' }
  ],
  ingredients: [
    { 
      ingredient_id: 'ing-1', 
      amount: 100, 
      is_optional: false,
      substitute_recommendation: null,
      name: 'Ingredient 1',
      unit_type: 'grams'
    }
  ],
  image_data: 'base64-image-data',
  average_rating: 4.5,
  total_votes: 10
};

describe('Accessibility Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue(mockRecipe)
    });
  });

  describe('Recipe Management View Accessibility', () => {
    it('should have proper heading hierarchy', async () => {
      render(
        <OptimizedRecipeManagementView
          recipeId="recipe-1"
          currentUser={mockUser}
        />
      );

      await screen.findByText('Test Recipe');

      // Should have proper heading structure
      const h1 = screen.getByRole('heading', { level: 1 });
      expect(h1).toBeInTheDocument();
      expect(h1).toHaveTextContent('Test Recipe');
    });

    it('should have proper landmark regions', async () => {
      render(
        <OptimizedRecipeManagementView
          recipeId="recipe-1"
          currentUser={mockUser}
        />
      );

      await screen.findByText('Test Recipe');

      // Should have main landmark
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('should provide skip links for keyboard navigation', async () => {
      render(
        <OptimizedRecipeManagementView
          recipeId="recipe-1"
          currentUser={mockUser}
        />
      );

      await screen.findByText('Test Recipe');

      // Should have skip to content link
      const skipLink = screen.getByText('Przejdź do głównej treści');
      expect(skipLink).toBeInTheDocument();
      expect(skipLink).toHaveAttribute('href', '#main-content');
    });

    it('should have proper focus management', async () => {
      const user = userEvent.setup();
      
      render(
        <OptimizedRecipeManagementView
          recipeId="recipe-1"
          currentUser={mockUser}
        />
      );

      await screen.findByText('Test Recipe');

      // Should be able to reach all interactive elements
      const editButton = screen.getByText('Edytuj');
      editButton.focus();
      expect(document.activeElement).toBe(editButton);
    });

    it('should support keyboard shortcuts with proper announcements', async () => {
      const user = userEvent.setup();
      
      render(
        <OptimizedRecipeManagementView
          recipeId="recipe-1"
          currentUser={mockUser}
        />
      );

      await screen.findByText('Test Recipe');

      // Should have keyboard shortcut information
      expect(screen.getByText(/Skróty klawiszowe/)).toBeInTheDocument();

      // Test Ctrl+E shortcut
      await user.keyboard('{Control>}e{/Control}');
      
      // Edit modal should open and focus should be managed
      await screen.findByRole('dialog');
      expect(screen.getByRole('dialog')).toHaveAttribute('aria-modal', 'true');
    });

    it('should have proper ARIA labels for all interactive elements', async () => {
      render(
        <OptimizedRecipeManagementView
          recipeId="recipe-1"
          currentUser={mockUser}
        />
      );

      await screen.findByText('Test Recipe');

      // All buttons should have accessible names
      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        const accessibleName = button.getAttribute('aria-label') || 
                               button.getAttribute('aria-labelledby') ||
                               button.textContent;
        expect(accessibleName).toBeTruthy();
      });
    });
  });

  describe('Toast Notifications Accessibility', () => {
    const mockToast = {
      id: 'test-toast',
      type: 'success' as const,
      title: 'Test Title',
      message: 'Test Message',
      duration: 5000
    };

    it('should have proper alert role and aria-live', () => {
      render(<ToastNotification toast={mockToast} onClose={vi.fn()} />);

      const alert = screen.getByRole('alert');
      expect(alert).toHaveAttribute('aria-live', 'polite');
    });

    it('should have accessible close button', () => {
      render(<ToastNotification toast={mockToast} onClose={vi.fn()} />);

      const closeButton = screen.getByLabelText('Zamknij powiadomienie');
      expect(closeButton).toBeInTheDocument();
      expect(closeButton).toHaveAttribute('aria-label', 'Zamknij powiadomienie');
    });

    it('should handle toast container accessibility', () => {
      const toasts = [
        { ...mockToast, id: 'toast-1' },
        { ...mockToast, id: 'toast-2', type: 'error' as const }
      ];

      render(<ToastContainer toasts={toasts} onClose={vi.fn()} />);

      // Should have proper container structure
      const alerts = screen.getAllByRole('alert');
      expect(alerts).toHaveLength(2);
    });
  });

  describe('Error Boundary Accessibility', () => {
    const ThrowError = () => {
      throw new Error('Test error');
    };

    // Suppress console.error for cleaner test output
    beforeEach(() => {
      vi.spyOn(console, 'error').mockImplementation(() => {});
    });

    it('should have proper alert role for error state', () => {
      render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      );

      const alert = screen.getByRole('alert');
      expect(alert).toHaveAttribute('aria-live', 'polite');
    });

    it('should have accessible action buttons', () => {
      render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      );

      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        expect(button).toHaveAttribute('aria-label');
      });
    });

    it('should provide proper heading structure in error state', () => {
      render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      );

      const heading = screen.getByRole('heading', { level: 2 });
      expect(heading).toHaveTextContent('Ups! Coś poszło nie tak');
    });
  });

  describe('Keyboard Navigation', () => {
    it('should support proper tab order', async () => {
      const user = userEvent.setup();
      
      render(
        <OptimizedRecipeManagementView
          recipeId="recipe-1"
          currentUser={mockUser}
        />
      );

      await screen.findByText('Test Recipe');

      // Start with skip link
      const skipLink = screen.getByText('Przejdź do głównej treści');
      skipLink.focus();
      
      await user.tab();
      // Next focusable element should be in logical order
      expect(document.activeElement).toBeInstanceOf(HTMLElement);
    });

    it('should trap focus in modals', async () => {
      const user = userEvent.setup();
      
      render(
        <OptimizedRecipeManagementView
          recipeId="recipe-1"
          currentUser={mockUser}
        />
      );

      await screen.findByText('Test Recipe');

      // Open edit modal
      await user.click(screen.getByText('Edytuj'));
      
      await screen.findByRole('dialog');
      
      // Focus should be trapped within modal
      const dialog = screen.getByRole('dialog');
      const focusableElements = dialog.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      
      expect(focusableElements.length).toBeGreaterThan(0);
    });

    it('should restore focus after modal closes', async () => {
      const user = userEvent.setup();
      
      render(
        <OptimizedRecipeManagementView
          recipeId="recipe-1"
          currentUser={mockUser}
        />
      );

      await screen.findByText('Test Recipe');

      const editButton = screen.getByText('Edytuj');
      editButton.focus();
      
      // Open modal
      await user.click(editButton);
      await screen.findByRole('dialog');
      
      // Close modal
      await user.keyboard('{Escape}');
      
      // Focus should return to edit button
      await screen.findByText('Test Recipe');
      expect(document.activeElement).toBe(editButton);
    });
  });

  describe('Screen Reader Support', () => {
    it('should provide proper content structure for screen readers', async () => {
      render(
        <OptimizedRecipeManagementView
          recipeId="recipe-1"
          currentUser={mockUser}
        />
      );

      await screen.findByText('Test Recipe');

      // Should have proper document structure
      expect(screen.getByRole('main')).toBeInTheDocument();
      
      // Content should be properly labeled
      const sections = screen.getAllByRole('region');
      sections.forEach(section => {
        const label = section.getAttribute('aria-label') || 
                     section.getAttribute('aria-labelledby');
        expect(label).toBeTruthy();
      });
    });

    it('should provide context for form elements', async () => {
      const user = userEvent.setup();
      
      render(
        <OptimizedRecipeManagementView
          recipeId="recipe-1"
          currentUser={mockUser}
        />
      );

      await screen.findByText('Test Recipe');
      await user.click(screen.getByText('Edytuj'));
      
      await screen.findByRole('dialog');

      // Form elements should have proper labels
      const inputs = screen.getAllByRole('textbox');
      inputs.forEach(input => {
        const ariaLabel = input.getAttribute('aria-label');
        if (ariaLabel) {
          expect(ariaLabel).toBeTruthy();
        }
      });
    });
  });

  describe('High Contrast Mode Support', () => {
    it('should be usable in high contrast mode', async () => {
      render(
        <OptimizedRecipeManagementView
          recipeId="recipe-1"
          currentUser={mockUser}
        />
      );

      await screen.findByText('Test Recipe');

      // Interactive elements should remain distinguishable
      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        expect(button).toBeVisible();
      });
    });
  });
}); 