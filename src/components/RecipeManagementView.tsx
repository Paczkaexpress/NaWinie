import React from 'react';
import type { RecipeManagementViewProps } from '../types';
import { useRecipeManagement } from '../hooks/useRecipeManagement';
import RecipeManagementHeader from './RecipeManagementHeader';
import RecipeDetailsSection from './RecipeDetailsSection';
import RecipeRatingSection from './RecipeRatingSection';
import RecipeEditModal from './RecipeEditModal';

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

  // Loading state
  if (isLoading && !recipe) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Error state
  if (error && !recipe) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-xl mb-4">{error}</div>
          <button
            onClick={handleBack}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
          >
            Powrót
          </button>
        </div>
      </div>
    );
  }

  const currentRecipe = recipe || initialRecipe;

  if (!currentRecipe) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-gray-600 text-xl mb-4">Przepis nie został znaleziony</div>
          <button
            onClick={handleBack}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
          >
            Powrót
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header with title and action buttons */}
      <RecipeManagementHeader
        recipe={currentRecipe}
        isAuthor={isAuthor}
        onEdit={openEditModal}
        onDelete={openDeleteConfirm}
        onBack={handleBack}
      />

      {/* Global error message */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="text-red-800">{error}</div>
        </div>
      )}

      {/* Recipe details */}
      <RecipeDetailsSection
        recipe={currentRecipe}
        isEditable={isAuthor}
      />

      {/* Rating section (only for non-authors) */}
      {!isAuthor && (
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Potwierdź usunięcie
            </h3>
            <p className="text-gray-600 mb-6">
              Czy na pewno chcesz usunąć przepis "{currentRecipe.name}"? 
              Ta operacja jest nieodwracalna.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={closeDeleteConfirm}
                disabled={isDeleting}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Anuluj
              </button>
              <button
                onClick={deleteRecipe}
                disabled={isDeleting}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center"
              >
                {isDeleting && (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                )}
                Usuń przepis
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RecipeManagementView; 