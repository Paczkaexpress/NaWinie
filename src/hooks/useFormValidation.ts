import { useState, useCallback, useMemo } from 'react';
import type { CreateRecipeFormData, FormValidationState } from '../types';

interface UseFormValidationReturn {
  errors: FormValidationState;
  isValid: boolean;
  validateField: (field: keyof CreateRecipeFormData, value: any) => string | null;
  validateForm: (formData: CreateRecipeFormData) => boolean;
  clearErrors: () => void;
  clearFieldError: (field: keyof FormValidationState) => void;
}

export const useFormValidation = (): UseFormValidationReturn => {
  const [errors, setErrors] = useState<FormValidationState>({
    name: null,
    preparation_time_minutes: null,
    complexity_level: null,
    steps: [],
    ingredients: [],
    image: null,
    general: null,
  });

  const validateName = useCallback((name: string): string | null => {
    if (!name.trim()) {
      return 'Nazwa przepisu jest wymagana';
    }
    if (name.length > 100) {
      return 'Nazwa przepisu nie może być dłuższa niż 100 znaków';
    }
    return null;
  }, []);

  const validatePreparationTime = useCallback((time: number): string | null => {
    if (time <= 0) {
      return 'Czas przygotowania musi być większy niż 0';
    }
    if (time > 999) {
      return 'Czas przygotowania nie może być większy niż 999 minut';
    }
    return null;
  }, []);

  const validateComplexityLevel = useCallback((level: string): string | null => {
    const validLevels = ['easy', 'medium', 'hard'];
    if (!validLevels.includes(level)) {
      return 'Wybierz poziom trudności';
    }
    return null;
  }, []);

  const validateIngredients = useCallback((ingredients: CreateRecipeFormData['ingredients']): Array<{
    ingredient_id: string | null;
    amount: string | null;
    substitute_recommendation: string | null;
  }> => {
    return ingredients.map(ingredient => {
      const ingredientErrors = {
        ingredient_id: null as string | null,
        amount: null as string | null,
        substitute_recommendation: null as string | null,
      };

      if (!ingredient.ingredient_id) {
        ingredientErrors.ingredient_id = 'Wybierz składnik';
      }

      if (ingredient.amount <= 0) {
        ingredientErrors.amount = 'Ilość musi być większa niż 0';
      }

      if (ingredient.substitute_recommendation && ingredient.substitute_recommendation.length > 100) {
        ingredientErrors.substitute_recommendation = 'Opis zamiennika nie może być dłuższy niż 100 znaków';
      }

      return ingredientErrors;
    });
  }, []);

  const validateSteps = useCallback((steps: CreateRecipeFormData['steps']): Array<string | null> => {
    return steps.map(step => {
      if (!step.description.trim()) {
        return 'Opis kroku jest wymagany';
      }
      if (step.description.length > 500) {
        return 'Opis kroku nie może być dłuższy niż 500 znaków';
      }
      return null;
    });
  }, []);

  const validateImage = useCallback((file: File | undefined): string | null => {
    if (!file) return null; // Image is optional

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return 'Dozwolone formaty: JPEG, PNG, WebP';
    }

    const maxSize = 1024 * 1024; // 1MB
    if (file.size > maxSize) {
      return 'Plik jest za duży (max 1MB)';
    }

    return null;
  }, []);

  const validateField = useCallback((field: keyof CreateRecipeFormData, value: any): string | null => {
    switch (field) {
      case 'name':
        return validateName(value);
      case 'preparation_time_minutes':
        return validatePreparationTime(value);
      case 'complexity_level':
        return validateComplexityLevel(value);
      case 'image':
        return validateImage(value);
      default:
        return null;
    }
  }, [validateName, validatePreparationTime, validateComplexityLevel, validateImage]);

  const validateForm = useCallback((formData: CreateRecipeFormData): boolean => {
    const newErrors: FormValidationState = {
      name: validateName(formData.name),
      preparation_time_minutes: validatePreparationTime(formData.preparation_time_minutes),
      complexity_level: validateComplexityLevel(formData.complexity_level),
      steps: validateSteps(formData.steps),
      ingredients: validateIngredients(formData.ingredients),
      image: validateImage(formData.image),
      general: null,
    };

    // Check for minimum requirements
    if (formData.ingredients.length === 0) {
      newErrors.general = 'Przepis musi zawierać co najmniej jeden składnik';
    } else if (formData.steps.length === 0) {
      newErrors.general = 'Przepis musi zawierać co najmniej jeden krok';
    }

    setErrors(newErrors);

    // Check if form is valid
    const hasBasicErrors = !!(
      newErrors.name || 
      newErrors.preparation_time_minutes || 
      newErrors.complexity_level || 
      newErrors.image ||
      newErrors.general
    );

    const hasIngredientErrors = newErrors.ingredients.some(error => 
      error.ingredient_id || error.amount || error.substitute_recommendation
    );

    const hasStepErrors = newErrors.steps.some(error => error !== null);

    return !(hasBasicErrors || hasIngredientErrors || hasStepErrors);
  }, [validateName, validatePreparationTime, validateComplexityLevel, validateImage, validateIngredients, validateSteps]);

  const clearErrors = useCallback(() => {
    setErrors({
      name: null,
      preparation_time_minutes: null,
      complexity_level: null,
      steps: [],
      ingredients: [],
      image: null,
      general: null,
    });
  }, []);

  const clearFieldError = useCallback((field: keyof FormValidationState) => {
    setErrors(prev => ({
      ...prev,
      [field]: field === 'steps' || field === 'ingredients' ? [] : null,
    }));
  }, []);

  const isValid = useMemo(() => {
    const hasBasicErrors = !!(
      errors.name || 
      errors.preparation_time_minutes || 
      errors.complexity_level || 
      errors.image ||
      errors.general
    );

    const hasIngredientErrors = errors.ingredients.some(error => 
      error && (error.ingredient_id || error.amount || error.substitute_recommendation)
    );

    const hasStepErrors = errors.steps.some(error => error !== null);

    return !(hasBasicErrors || hasIngredientErrors || hasStepErrors);
  }, [errors]);

  return {
    errors,
    isValid,
    validateField,
    validateForm,
    clearErrors,
    clearFieldError,
  };
}; 