import React, { useState } from 'react';
import type { RecipeEditModalProps } from '../types';
import { useRecipeEditForm } from '../hooks/useRecipeEditForm';
import EditRecipeForm from './EditRecipeForm';

const RecipeEditModal: React.FC<RecipeEditModalProps> = ({
  isOpen,
  recipe,
  onSave,
  onCancel
}) => {
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const {
    formData,
    validationState,
    validateForm,
    updateName,
    updatePreparationTime,
    updateComplexityLevel,
    updateStep,
    addStep,
    removeStep,
    updateIngredient,
    addIngredient,
    removeIngredient,
    getUpdateCommand,
    resetForm,
    hasChanges
  } = useRecipeEditForm(recipe);

  const handleSave = async () => {
    setSaveError(null);
    
    // Validate form before saving
    if (!validateForm()) {
      setSaveError('Popraw błędy w formularzu przed zapisaniem');
      return;
    }

    setIsSaving(true);
    
    try {
      const updateCommand = getUpdateCommand();
      await onSave(updateCommand);
      // Modal will be closed by parent component after successful save
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Błąd podczas zapisywania przepisu';
      setSaveError(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (hasChanges) {
      const confirmed = window.confirm(
        'Masz niezapisane zmiany. Czy na pewno chcesz anulować edycję?'
      );
      if (!confirmed) return;
    }
    
    resetForm();
    setSaveError(null);
    onCancel();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">
            Edytuj przepis: {recipe.name}
          </h2>
          <button
            onClick={handleCancel}
            disabled={isSaving}
            className="text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {/* Error Message */}
          {saveError && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="text-red-800">{saveError}</div>
            </div>
          )}

          {/* Edit Form */}
          <EditRecipeForm
            formData={formData}
            validationState={validationState}
            onUpdateName={updateName}
            onUpdatePreparationTime={updatePreparationTime}
            onUpdateComplexityLevel={updateComplexityLevel}
            onUpdateStep={updateStep}
            onAddStep={addStep}
            onRemoveStep={removeStep}
            onUpdateIngredient={updateIngredient}
            onAddIngredient={addIngredient}
            onRemoveIngredient={removeIngredient}
          />
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {hasChanges && (
              <div className="text-sm text-amber-600 flex items-center">
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                Masz niezapisane zmiany
              </div>
            )}
          </div>
          
          <div className="flex space-x-3">
            <button
              onClick={handleCancel}
              disabled={isSaving}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Anuluj
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving || !hasChanges}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center"
            >
              {isSaving && (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              )}
              Zapisz zmiany
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RecipeEditModal; 