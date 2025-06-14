import React, { useState } from 'react';
import type { CreateRecipeFormData, FormValidationState } from '../types';
import BasicInfoSection from './BasicInfoSection';

const AddRecipeForm: React.FC = () => {
  const [formData, setFormData] = useState<CreateRecipeFormData>({
    name: '',
    preparation_time_minutes: 0,
    complexity_level: 'easy',
    steps: [],
    ingredients: [],
    image: undefined,
  });

  const [errors, setErrors] = useState<FormValidationState>({
    name: null,
    preparation_time_minutes: null,
    complexity_level: null,
    steps: [],
    ingredients: [],
    image: null,
    general: null,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleBasicInfoChange = (field: keyof CreateRecipeFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
    
    // Clear validation error when user starts typing
    if (errors[field as keyof FormValidationState]) {
      setErrors(prev => ({
        ...prev,
        [field]: null,
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // TODO: Implement form submission logic
      console.log('Form data:', formData);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // TODO: Handle success - redirect to recipe details
      console.log('Recipe submitted successfully');
      
    } catch (error) {
      console.error('Error submitting recipe:', error);
      setErrors(prev => ({
        ...prev,
        general: 'Wystąpił błąd podczas zapisywania przepisu. Spróbuj ponownie.',
      }));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    // TODO: Implement navigation back to recipes list
    window.history.back();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* General error message */}
      {errors.general && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-sm text-red-600">{errors.general}</p>
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

      {/* TODO: Add other sections */}
      {/* - ImageUploader */}
      {/* - IngredientsSection */}
      {/* - StepsSection */}

      {/* Form Actions */}
      <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
        <button
          type="button"
          onClick={handleCancel}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Anuluj
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Zapisywanie...' : 'Zapisz przepis'}
        </button>
      </div>
    </form>
  );
};

export default AddRecipeForm; 