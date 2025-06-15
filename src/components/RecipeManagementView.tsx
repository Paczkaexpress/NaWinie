import React from 'react';
import type { RecipeManagementViewProps } from '../types';
import { useRecipeManagement } from '../hooks/useRecipeManagement';
import RecipeManagementHeader from './RecipeManagementHeader';
import RecipeDetailsSection from './RecipeDetailsSection';
import RecipeRatingSection from './RecipeRatingSection';
import RecipeEditModal from './RecipeEditModal';
import { RecipeHeaderSkeleton, RecipeDetailsSkeleton, RecipeRatingSkeleton } from './LoadingSkeleton';

const RecipeManagementView: React.FC<RecipeManagementViewProps> = ({
  recipeId,
  initialRecipe,
  currentUser
}) => {
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

  const handleBack = () => {
    // Navigate back to recipe detail or recipes list
    window.history.back();
  };

  const handleRatingSubmit = async (rating: number) => {
    // This will be handled by RecipeRatingSection component
    // We might need to refetch recipe data to update average rating
    await refetch();
  };

  const currentRecipe = recipe || initialRecipe;

  // Loading state with skeletons
  if (isLoading && !currentRecipe) {
    return (
      <div className="max-w-4xl mx-auto animate-fadeIn">
        <RecipeHeaderSkeleton />
        <RecipeDetailsSkeleton />
        <div className="mt-8">
          <RecipeRatingSkeleton />
        </div>
      </div>
    );
  }

  // Error state
  if (error && !currentRecipe) {
    return (
      <div className="min-h-screen flex items-center justify-center animate-fadeIn">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="mb-6">
            <svg className="w-16 h-16 mx-auto text-red-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Ups! Coś poszło nie tak</h2>
            <p className="text-red-600 text-lg mb-6">{error}</p>
          </div>
          <button
            onClick={handleBack}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Powrót
          </button>
        </div>
      </div>
    );
  }

  if (!currentRecipe) {
    return (
      <div className="min-h-screen flex items-center justify-center animate-fadeIn">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="mb-6">
            <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Przepis nie znaleziony</h2>
            <p className="text-gray-600 mb-6">Nie mogliśmy znaleźć przepisu o podanym identyfikatorze.</p>
          </div>
          <button
            onClick={handleBack}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Powrót
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto animate-fadeIn">
      {/* Header with title and action buttons */}
      <div className="animate-slideDown">
        <RecipeManagementHeader
          recipe={currentRecipe}
          isAuthor={isAuthor}
          onEdit={openEditModal}
          onDelete={openDeleteConfirm}
          onBack={handleBack}
        />
      </div>

      {/* Global error message */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg animate-slideDown">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-red-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <div className="text-red-800">{error}</div>
          </div>
        </div>
      )}

      {/* Recipe details */}
      <div className="animate-slideUp" style={{ animationDelay: '0.1s' }}>
        <RecipeDetailsSection
          recipe={currentRecipe}
          isEditable={isAuthor}
        />
      </div>

      {/* Rating section (only for non-authors) */}
      {!isAuthor && (
        <div className="mt-8 animate-slideUp" style={{ animationDelay: '0.2s' }}>
          <RecipeRatingSection
            recipeId={recipeId}
            currentRating={{
              average_rating: currentRecipe.average_rating || 0,
              total_votes: currentRecipe.total_votes || 0
            }}
            isAuthor={isAuthor}
            hasUserRated={false} // This should be determined by API or additional hook
            onRatingSubmit={handleRatingSubmit}
          />
        </div>
      )}

      {/* Edit Modal */}
      {isEditModalOpen && (
        <RecipeEditModal
          isOpen={isEditModalOpen}
          recipe={currentRecipe}
          onSave={updateRecipe}
          onCancel={closeEditModal}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-fadeIn">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 animate-scaleIn">
            <div className="flex items-center mb-4">
              <div className="flex-shrink-0">
                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h3 className="ml-3 text-lg font-semibold text-gray-900">
                Potwierdź usunięcie
              </h3>
            </div>
            <p className="text-gray-600 mb-6">
              Czy na pewno chcesz usunąć przepis <strong>"{currentRecipe.name}"</strong>? 
              Ta operacja jest nieodwracalna i wszystkie dane związane z przepisem zostaną utracone.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={closeDeleteConfirm}
                disabled={isDeleting}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-all duration-200 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
              >
                Anuluj
              </button>
              <button
                onClick={deleteRecipe}
                disabled={isDeleting}
                className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all duration-200 disabled:opacity-50 flex items-center focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
              >
                {isDeleting && (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                )}
                {isDeleting ? 'Usuwanie...' : 'Usuń przepis'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RecipeManagementView; 