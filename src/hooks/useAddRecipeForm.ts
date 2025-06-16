import { useState, useCallback } from 'react';
import type { CreateRecipeFormData, CreateRecipeCommand } from '../types';
import { authService } from '../lib/auth';

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
  complexity_level: 'EASY',
  steps: [],
  ingredients: [],
  image: undefined,
};

export const useAddRecipeForm = (): UseAddRecipeFormReturn => {
  const [formData, setFormData] = useState<CreateRecipeFormData>(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const updateFormData = useCallback((updates: Partial<CreateRecipeFormData>) => {
    setFormData(prev => {
      const newData = {
        ...prev,
        ...updates,
      };
      
      // Store current form state for progress tracking
      sessionStorage.setItem('current_recipe_form_state', JSON.stringify(newData));
      
      // Emit custom event for progress tracking
      window.dispatchEvent(new CustomEvent('recipeFormStateChange'));
      
      return newData;
    });
    
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
      
      // Debug: Log the command being sent
      console.log('Submitting recipe command:', {
        name: command.name,
        preparation_time_minutes: command.preparation_time_minutes,
        complexity_level: command.complexity_level,
        steps: command.steps,
        ingredients: command.ingredients,
        hasImage: !!formData.image
      });
      
      // Get auth session and token
      const session = await authService.getSession();
      console.log('Auth session:', { hasSession: !!session, hasToken: !!session?.access_token });
      
      if (!session?.access_token) {
        throw new Error('Brak tokenu uwierzytelniania');
      }
      const token = session.access_token;

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
        console.log('Sending with FormData (image included)');
        // Don't set Content-Type header - let browser set it with boundary
      } else {
        // If no image, send JSON
        headers['Content-Type'] = 'application/json';
        body = JSON.stringify(command);
        console.log('Sending as JSON (no image)');
      }

      console.log('Making request to /api/recipes with headers:', headers);

      const response = await fetch('/api/recipes-clean', {
        method: 'POST',
        headers,
        body,
      });

      console.log('Response received:', {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries())
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        
        switch (response.status) {
          case 400:
            throw new Error(errorData.message || 'Nieprawidłowe dane formularza');
          case 401:
            // Token expired or invalid - logout and redirect to login
            await authService.logout();
            window.location.href = '/auth?returnUrl=' + encodeURIComponent('/add-recipe');
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
      
      // Clear session storage on successful submission
      sessionStorage.removeItem('current_recipe_form_state');
      
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
    
    // Clear session storage for progress tracking
    sessionStorage.removeItem('current_recipe_form_state');
    window.dispatchEvent(new CustomEvent('recipeFormStateChange'));
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