import React, { useState, useEffect, useCallback } from 'react';
import { useAddRecipeForm } from '../hooks/useAddRecipeForm';
import { useFormValidation } from '../hooks/useFormValidation';
import { useImageUpload } from '../hooks/useImageUpload';
import { useIngredients } from '../hooks/useIngredients';
import { useFormPersistence } from '../hooks/useFormPersistence';
import BasicInfoSection from './BasicInfoSection';
import ImageUploader from './ImageUploader';
import IngredientsSection from './IngredientsSection';
import StepsSection from './StepsSection';

const AddRecipeForm: React.FC = () => {
  const [showRestoreDialog, setShowRestoreDialog] = useState(false);
  const [hasLoadedSavedData, setHasLoadedSavedData] = useState(false);

  // Initialize hooks
  const { formData, isSubmitting, submitError, updateFormData, submitForm, resetForm } = useAddRecipeForm();
  const { errors, isValid, validateForm, clearFieldError } = useFormValidation();
  const { imagePreview, uploadError, selectImage, removeImage } = useImageUpload();
  const { ingredients, loading: loadingIngredients, error: ingredientsError } = useIngredients();
  const { loadFormData, clearFormData, hasSavedData } = useFormPersistence({ 
    formData,
    autoSave: true 
  });

  // Handle form persistence on mount
  useEffect(() => {
    if (hasSavedData && !hasLoadedSavedData) {
      setShowRestoreDialog(true);
    }
  }, [hasSavedData, hasLoadedSavedData]);

  const handleRestoreSavedData = useCallback(() => {
    const savedData = loadFormData();
    if (savedData) {
      updateFormData(savedData);
      setHasLoadedSavedData(true);
    }
    setShowRestoreDialog(false);
  }, [loadFormData, updateFormData]);

  const handleDismissRestore = useCallback(() => {
    clearFormData();
    setShowRestoreDialog(false);
  }, [clearFormData]);

  const handleBasicInfoChange = useCallback((field: string, value: any) => {
    console.log('handleBasicInfoChange called with:', field, value);
    updateFormData({ [field]: value });
    clearFieldError(field as any);
  }, [updateFormData, clearFieldError]);

  const handleImageSelect = useCallback((file: File) => {
    selectImage(file);
    updateFormData({ image: file });
  }, [selectImage, updateFormData]);

  const handleImageRemove = useCallback(() => {
    removeImage();
    updateFormData({ image: undefined });
  }, [removeImage, updateFormData]);

  const handleIngredientsChange = useCallback((ingredients: typeof formData.ingredients) => {
    updateFormData({ ingredients });
    clearFieldError('ingredients');
  }, [updateFormData, clearFieldError]);

  const handleStepsChange = useCallback((steps: typeof formData.steps) => {
    updateFormData({ steps });
    clearFieldError('steps');
  }, [updateFormData, clearFieldError]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm(formData)) {
      return;
    }

    const success = await submitForm();
    if (success) {
      // Clear saved form data on successful submission
      clearFormData();
    }
  };

  const handleCancel = () => {
    window.history.back();
  };

  if (loadingIngredients) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        <span className="ml-2 text-gray-600">Ładowanie składników...</span>
      </div>
    );
  }

  return (
    <>
      {/* Restore Dialog */}
      {showRestoreDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md mx-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Przywrócić zapisane dane?
            </h3>
            <p className="text-sm text-gray-600 mb-6">
              Znaleziono niezakończony formularz przepisu. Czy chcesz przywrócić wprowadzone dane?
            </p>
            <div className="flex space-x-4">
              <button
                onClick={handleRestoreSavedData}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Przywróć
              </button>
              <button
                onClick={handleDismissRestore}
                className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                Rozpocznij od nowa
              </button>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* General error messages */}
        {(submitError || errors.general || ingredientsError) && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            {submitError && <p className="text-sm text-red-600 mb-2">{submitError}</p>}
            {errors.general && <p className="text-sm text-red-600 mb-2">{errors.general}</p>}
            {ingredientsError && <p className="text-sm text-red-600">{ingredientsError}</p>}
          </div>
        )}

        {/* Basic Information Section */}
        <BasicInfoSection
          values={{
            name: formData.name,
            preparation_time_minutes: formData.preparation_time_minutes,
            complexity_level: formData.complexity_level,
          }}
          onChange={handleBasicInfoChange}
          errors={{
            name: errors.name,
            preparation_time_minutes: errors.preparation_time_minutes,
            complexity_level: errors.complexity_level,
          }}
        />

        {/* Image Upload Section */}
        <ImageUploader
          onImageSelect={handleImageSelect}
          onImageRemove={handleImageRemove}
          preview={imagePreview}
          error={uploadError || errors.image}
        />

        {/* Ingredients Section */}
        <IngredientsSection
          ingredients={formData.ingredients}
          onIngredientsChange={handleIngredientsChange}
          errors={errors.ingredients}
        />

        {/* Steps Section */}
        <StepsSection
          steps={formData.steps}
          onStepsChange={handleStepsChange}
          errors={errors.steps}
        />

        {/* Form Actions */}
        <div className="flex justify-between items-center pt-6 border-t border-gray-200">
          <div className="text-sm text-gray-500">
            {hasSavedData && (
              <span className="inline-flex items-center">
                <svg className="w-4 h-4 mr-1 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Formularz zapisywany automatycznie
              </span>
            )}
          </div>
          
          <div className="flex space-x-4">
            <button
              type="button"
              onClick={handleCancel}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Anuluj
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !isValid}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Zapisywanie...' : 'Zapisz przepis'}
            </button>
          </div>
        </div>
      </form>
    </>
  );
};

export default AddRecipeForm; 