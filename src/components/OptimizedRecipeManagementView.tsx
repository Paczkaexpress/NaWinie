import React, { memo, useCallback, useMemo, useRef, useEffect } from 'react';
import type { RecipeManagementViewProps } from '../types';
import { useRecipeManagement } from '../hooks/useRecipeManagement';
import { useRecipeToasts } from '../hooks/useToast';
import { ToastContainer } from './ToastNotification';
import { RecipeErrorBoundary } from './ErrorBoundary';
import RecipeManagementHeader from './RecipeManagementHeader';
import RecipeDetailsSection from './RecipeDetailsSection';
import RecipeRatingSection from './RecipeRatingSection';
import RecipeEditModal from './RecipeEditModal';
import { RecipeHeaderSkeleton, RecipeDetailsSkeleton, RecipeRatingSkeleton } from './LoadingSkeleton';

// Memoized components for better performance
const MemoizedRecipeManagementHeader = memo(RecipeManagementHeader);
const MemoizedRecipeDetailsSection = memo(RecipeDetailsSection);
const MemoizedRecipeRatingSection = memo(RecipeRatingSection);
const MemoizedRecipeEditModal = memo(RecipeEditModal);

const OptimizedRecipeManagementView: React.FC<RecipeManagementViewProps> = ({
  recipeId,
  initialRecipe,
  currentUser
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const skipLinkRef = useRef<HTMLAnchorElement>(null);
  
  const {
    recipe,
    isLoading,
    error,
    isEditModalOpen,
    isDeleting,
    deleteConfirmOpen,
    updateRecipe,
    deleteRecipe,
    isAuthor,
    openEditModal,
    closeEditModal,
    openDeleteConfirm,
    closeDeleteConfirm,
    refetch
  } = useRecipeManagement(recipeId, currentUser);

  const {
    toasts,
    removeToast,
    showRecipeSaved,
    showRecipeDeleted,
    showRecipeError,
    showNetworkError,
    showAuthError,
    showPermissionError
  } = useRecipeToasts();

  // Memoized callbacks for performance
  const handleBack = useCallback(() => {
    window.history.back();
  }, []);

  const handleRatingSubmit = useCallback(async (rating: number) => {
    try {
      await refetch();
    } catch (error) {
      showNetworkError();
    }
  }, [refetch, showNetworkError]);

  const handleUpdateRecipe = useCallback(async (updatedRecipe: any) => {
    try {
      await updateRecipe(updatedRecipe);
      showRecipeSaved(updatedRecipe.name);
    } catch (error: any) {
      if (error?.status === 401) {
        showAuthError();
      } else if (error?.status === 403) {
        showPermissionError();
      } else {
        showRecipeError('zapisywania przepisu', error?.message);
      }
      throw error;
    }
  }, [updateRecipe, showRecipeSaved, showRecipeError, showAuthError, showPermissionError]);

  const handleDeleteRecipe = useCallback(async () => {
    try {
      const recipeName = currentRecipe?.name || 'przepis';
      await deleteRecipe();
      showRecipeDeleted(recipeName);
      setTimeout(() => {
        window.location.href = '/recipes';
      }, 2000);
    } catch (error: any) {
      if (error?.status === 401) {
        showAuthError();
      } else if (error?.status === 403) {
        showPermissionError();
      } else {
        showRecipeError('usuwania przepisu', error?.message);
      }
    }
  }, [deleteRecipe, showRecipeDeleted, showRecipeError, showAuthError, showPermissionError]);

  // Keyboard navigation implementation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Escape key closes modals
      if (event.key === 'Escape') {
        if (isEditModalOpen) {
          closeEditModal();
        } else if (deleteConfirmOpen) {
          closeDeleteConfirm();
        }
      }

      // Ctrl/Cmd + E opens edit modal (if author)
      if ((event.ctrlKey || event.metaKey) && event.key === 'e' && isAuthor && !isEditModalOpen) {
        event.preventDefault();
        openEditModal();
      }

      // Alt + B for back navigation
      if (event.altKey && event.key === 'b') {
        event.preventDefault();
        handleBack();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isEditModalOpen, deleteConfirmOpen, isAuthor, closeEditModal, closeDeleteConfirm, openEditModal, handleBack]);

  // Focus management for accessibility
  useEffect(() => {
    if (!isEditModalOpen && !deleteConfirmOpen && containerRef.current) {
      containerRef.current.focus();
    }
  }, [isEditModalOpen, deleteConfirmOpen]);

  // Skip link functionality
  const handleSkipToContent = useCallback((event: React.KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      const mainContent = document.getElementById('main-content');
      if (mainContent) {
        mainContent.focus();
        mainContent.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }, []);

  const currentRecipe = useMemo(() => recipe || initialRecipe, [recipe, initialRecipe]);

  // Loading state with skeleton components
  if (isLoading && !currentRecipe) {
    return (
      <div className="max-w-4xl mx-auto animate-fadeIn">
        <RecipeHeaderSkeleton />
        <RecipeDetailsSkeleton />
        <div className="mt-8">
          <RecipeRatingSkeleton />
        </div>
        <ToastContainer toasts={toasts} onClose={removeToast} />
      </div>
    );
  }

  // Error state with accessibility
  if (error && !currentRecipe) {
    return (
      <div className="min-h-screen flex items-center justify-center animate-fadeIn">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="mb-6">
            <svg 
              className="w-16 h-16 mx-auto text-red-400 mb-4" 
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
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Ups! Coś poszło nie tak</h1>
            <p className="text-red-600 text-lg mb-6">{error}</p>
          </div>
          <button
            onClick={handleBack}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            aria-label="Wróć do poprzedniej strony"
          >
            Powrót
          </button>
        </div>
        <ToastContainer toasts={toasts} onClose={removeToast} />
      </div>
    );
  }

  // Recipe not found state
  if (!currentRecipe) {
    return (
      <div className="min-h-screen flex items-center justify-center animate-fadeIn">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="mb-6">
            <svg 
              className="w-16 h-16 mx-auto text-gray-400 mb-4" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" 
              />
            </svg>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Przepis nie znaleziony</h1>
            <p className="text-gray-600 mb-6">Nie mogliśmy znaleźć przepisu o podanym identyfikatorze.</p>
          </div>
          <button
            onClick={handleBack}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            aria-label="Wróć do poprzedniej strony"
          >
            Powrót
          </button>
        </div>
        <ToastContainer toasts={toasts} onClose={removeToast} />
      </div>
    );
  }

  return (
    <RecipeErrorBoundary recipeName={currentRecipe.name}>
      {/* Skip to content link for accessibility */}
      <a
        ref={skipLinkRef}
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-blue-600 text-white px-4 py-2 rounded-lg z-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        onKeyDown={handleSkipToContent}
      >
        Przejdź do głównej treści
      </a>

      <div 
        ref={containerRef}
        className="max-w-4xl mx-auto animate-fadeIn"
        tabIndex={-1}
        role="main"
        aria-labelledby="recipe-title"
        aria-describedby="recipe-description"
      >
        {/* Header section */}
        <div className="animate-slideDown">
          <MemoizedRecipeManagementHeader
            recipe={currentRecipe}
            isAuthor={isAuthor}
            onEdit={openEditModal}
            onDelete={openDeleteConfirm}
            onBack={handleBack}
          />
        </div>

        {/* Error alert */}
        {error && (
          <div 
            className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg animate-slideDown"
            role="alert"
            aria-live="polite"
          >
            <div className="flex items-center">
              <svg 
                className="w-5 h-5 text-red-400 mr-3" 
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
              <div className="text-red-800">{error}</div>
            </div>
          </div>
        )}

        {/* Main content */}
        <main id="main-content" tabIndex={-1}>
          {/* Recipe details */}
          <div className="animate-slideUp" style={{ animationDelay: '0.1s' }}>
            <MemoizedRecipeDetailsSection
              recipe={currentRecipe}
              isEditable={isAuthor}
            />
          </div>

          {/* Rating section */}
          {!isAuthor && (
            <div className="mt-8 animate-slideUp" style={{ animationDelay: '0.2s' }}>
              <MemoizedRecipeRatingSection
                recipeId={recipeId}
                currentRating={{
                  average_rating: currentRecipe.average_rating || 0,
                  total_votes: currentRecipe.total_votes || 0
                }}
                isAuthor={isAuthor}
                hasUserRated={false}
                onRatingSubmit={handleRatingSubmit}
              />
            </div>
          )}
        </main>

        {/* Keyboard shortcuts accessibility info */}
        <div className="sr-only" aria-live="polite">
          <p>
            Skróty klawiszowe: Escape - zamknij modal, Alt+B - wróć
            {isAuthor && ', Ctrl+E - edytuj przepis'}
          </p>
        </div>

        {/* Edit Modal */}
        {isEditModalOpen && (
          <MemoizedRecipeEditModal
            isOpen={isEditModalOpen}
            recipe={currentRecipe}
            onSave={handleUpdateRecipe}
            onCancel={closeEditModal}
          />
        )}

        {/* Delete Confirmation Modal */}
        {deleteConfirmOpen && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-fadeIn"
            role="dialog"
            aria-labelledby="delete-dialog-title"
            aria-describedby="delete-dialog-description"
            aria-modal="true"
          >
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 animate-scaleIn">
              <div className="flex items-center mb-4">
                <div className="flex-shrink-0">
                  <svg 
                    className="w-8 h-8 text-red-600" 
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
                <h2 id="delete-dialog-title" className="ml-3 text-lg font-semibold text-gray-900">
                  Potwierdź usunięcie
                </h2>
              </div>
              <p id="delete-dialog-description" className="text-gray-600 mb-6">
                Czy na pewno chcesz usunąć przepis <strong>"{currentRecipe.name}"</strong>? 
                Ta operacja jest nieodwracalna i wszystkie dane związane z przepisem zostaną utracone.
              </p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={closeDeleteConfirm}
                  disabled={isDeleting}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-all duration-200 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                  aria-label="Anuluj usuwanie przepisu"
                >
                  Anuluj
                </button>
                <button
                  onClick={handleDeleteRecipe}
                  disabled={isDeleting}
                  className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all duration-200 disabled:opacity-50 flex items-center focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                  aria-label={isDeleting ? 'Usuwanie przepisu w toku' : 'Potwierdź usunięcie przepisu'}
                >
                  {isDeleting && (
                    <div 
                      className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"
                      aria-hidden="true"
                    ></div>
                  )}
                  {isDeleting ? 'Usuwanie...' : 'Usuń przepis'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Toast notifications */}
        <ToastContainer toasts={toasts} onClose={removeToast} />
      </div>
    </RecipeErrorBoundary>
  );
};

export default memo(OptimizedRecipeManagementView); 