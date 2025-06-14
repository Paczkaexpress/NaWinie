import { useState, useCallback } from 'react';
import type { CreateRecipeFormData, CreateRecipeCommand } from '../types';

interface UseAddRecipeFormReturn {
  formData: CreateRecipeFormData;
  isSubmitting: boolean;
  submitError: string | null;
  updateFormData: (updates: Partial<CreateRecipeFormData>) => void;
  submitForm: () => Promise<boolean>;
  resetForm: () => void;
}

const initialFormData: CreateRecipeFormData = {
  name: '',
  preparation_time_minutes: 0,
  complexity_level: 'easy',
  steps: [],
  ingredients: [],
  image: undefined,
};

export const useAddRecipeForm = (): UseAddRecipeFormReturn => {
  const [formData, setFormData] = useState<CreateRecipeFormData>(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const updateFormData = useCallback((updates: Partial<CreateRecipeFormData>) => {
    setFormData(prev => ({
      ...prev,
      ...updates,
    }));
    
    // Clear submit error when user makes changes
    if (submitError) {
      setSubmitError(null);
    }
  }, [submitError]);

  const transformFormDataToCommand = useCallback((data: CreateRecipeFormData): CreateRecipeCommand => {
    return {
      name: data.name.trim(),
      preparation_time_minutes: data.preparation_time_minutes,
      complexity_level: data.complexity_level,
      steps: data.steps.map(step => ({
        step: step.step,
        description: step.description.trim(),
      })),
      ingredients: data.ingredients.map(ingredient => ({
        ingredient_id: ingredient.ingredient_id,
        amount: ingredient.amount,
        is_optional: ingredient.is_optional,
        substitute_recommendation: ingredient.substitute_recommendation?.trim() || null,
      })),
    };
  }, []);

  const submitForm = useCallback(async (): Promise<boolean> => {
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const command = transformFormDataToCommand(formData);
      
      // Get auth token
      const token = localStorage.getItem('access_token');
      if (!token) {
        throw new Error('Brak tokenu uwierzytelniania');
      }

      // Prepare form data for submission (including image if present)
      let body: any;
      let headers: Record<string, string> = {
        'Authorization': `Bearer ${token}`,
      };

      if (formData.image) {
        // If image is present, use FormData
        const formDataToSend = new FormData();
        formDataToSend.append('recipe', JSON.stringify(command));
        formDataToSend.append('image', formData.image);
        body = formDataToSend;
        // Don't set Content-Type header - let browser set it with boundary
      } else {
        // If no image, send JSON
        headers['Content-Type'] = 'application/json';
        body = JSON.stringify(command);
      }

      const response = await fetch('/api/recipes', {
        method: 'POST',
        headers,
        body,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        
        switch (response.status) {
          case 400:
            throw new Error(errorData.message || 'Nieprawidłowe dane formularza');
          case 401:
            // Token expired or invalid - redirect to login
            localStorage.removeItem('access_token');
            window.location.href = '/auth?returnUrl=' + encodeURIComponent('/recipes/new');
            return false;
          case 403:
            throw new Error('Brak uprawnień do dodawania przepisów');
          case 500:
            throw new Error('Błąd serwera. Spróbuj ponownie później');
          default:
            throw new Error('Wystąpił nieoczekiwany błąd');
        }
      }

      const result = await response.json();
      
      // Success - redirect to recipe details
      if (result.id) {
        window.location.href = `/recipes/${result.id}`;
      } else {
        window.location.href = '/recipes';
      }
      
      return true;
      
    } catch (error) {
      console.error('Form submission error:', error);
      setSubmitError(error instanceof Error ? error.message : 'Wystąpił błąd podczas zapisywania przepisu');
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, transformFormDataToCommand]);

  const resetForm = useCallback(() => {
    setFormData(initialFormData);
    setSubmitError(null);
    setIsSubmitting(false);
  }, []);

  return {
    formData,
    isSubmitting,
    submitError,
    updateFormData,
    submitForm,
    resetForm,
  };
}; 