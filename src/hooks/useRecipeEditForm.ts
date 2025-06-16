import { useState, useCallback, useEffect } from 'react';
import type { 
  RecipeDetailDto, 
  EditRecipeFormData, 
  EditFormValidationState,
  UpdateRecipeCommand,
  RecipeStepFormData,
  RecipeIngredientFormData
} from '../types';

export function useRecipeEditForm(initialRecipe: RecipeDetailDto) {
  // Initialize form data from recipe
  const [formData, setFormData] = useState<EditRecipeFormData>(() => ({
    name: initialRecipe.name,
    preparation_time_minutes: initialRecipe.preparation_time_minutes,
    complexity_level: initialRecipe.complexity_level,
    steps: initialRecipe.steps.map(step => ({
      step: step.step,
      description: step.description
    })),
    ingredients: initialRecipe.ingredients.map(ing => ({
      ingredient_id: ing.ingredient_id,
      amount: ing.amount,
      is_optional: ing.is_optional,
      substitute_recommendation: ing.substitute_recommendation
    }))
  }));

  const [validationState, setValidationState] = useState<EditFormValidationState>({
    name: null,
    preparation_time_minutes: null,
    complexity_level: null,
    steps: [],
    ingredients: [],
    general: null
  });

  // Validation functions
  const validateName = useCallback((name: string): string | null => {
    if (!name || name.trim().length === 0) {
      return 'Nazwa przepisu jest wymagana';
    }
    if (name.trim().length > 255) {
      return 'Nazwa przepisu nie może przekraczać 255 znaków';
    }
    return null;
  }, []);

  const validatePreparationTime = useCallback((time: number): string | null => {
    if (!time || time <= 0) {
      return 'Czas przygotowania musi być większy od 0';
    }
    if (time > 9999) {
      return 'Czas przygotowania nie może przekraczać 9999 minut';
    }
    return null;
  }, []);

  const validateSteps = useCallback((steps: RecipeStepFormData[]): Array<string | null> => {
    if (steps.length === 0) {
      return ['Przepis musi zawierać co najmniej jeden krok'];
    }
    
    return steps.map(step => {
      if (!step.description || step.description.trim().length === 0) {
        return 'Opis kroku jest wymagany';
      }
      if (step.description.trim().length > 1000) {
        return 'Opis kroku nie może przekraczać 1000 znaków';
      }
      return null;
    });
  }, []);

  const validateIngredients = useCallback((ingredients: RecipeIngredientFormData[]): Array<{ ingredient_id: string | null; amount: string | null }> => {
    if (ingredients.length === 0) {
      return [{ ingredient_id: 'Przepis musi zawierać co najmniej jeden składnik', amount: null }];
    }
    
    return ingredients.map(ing => ({
      ingredient_id: ing.ingredient_id ? null : 'Wybierz składnik',
      amount: ing.amount <= 0 ? 'Ilość musi być większa od 0' : null
    }));
  }, []);

  // Validate entire form
  const validateForm = useCallback((): boolean => {
    const newValidationState: EditFormValidationState = {
      name: validateName(formData.name),
      preparation_time_minutes: validatePreparationTime(formData.preparation_time_minutes),
      complexity_level: null, // Always valid from select
      steps: validateSteps(formData.steps),
      ingredients: validateIngredients(formData.ingredients),
      general: null
    };

    setValidationState(newValidationState);

    // Check if form is valid
    const isValid = !newValidationState.name &&
                   !newValidationState.preparation_time_minutes &&
                   !newValidationState.complexity_level &&
                   newValidationState.steps.every(error => !error) &&
                   newValidationState.ingredients.every(ing => !ing.ingredient_id && !ing.amount) &&
                   !newValidationState.general;

    return isValid;
  }, [formData, validateName, validatePreparationTime, validateSteps, validateIngredients]);

  // Form field update functions
  const updateName = useCallback((name: string) => {
    setFormData(prev => ({ ...prev, name }));
    setValidationState(prev => ({ ...prev, name: validateName(name) }));
  }, [validateName]);

  const updatePreparationTime = useCallback((time: number) => {
    setFormData(prev => ({ ...prev, preparation_time_minutes: time }));
    setValidationState(prev => ({ ...prev, preparation_time_minutes: validatePreparationTime(time) }));
  }, [validatePreparationTime]);

  const updateComplexityLevel = useCallback((level: 'easy' | 'medium' | 'hard') => {
    setFormData(prev => ({ ...prev, complexity_level: level }));
  }, []);

  const updateStep = useCallback((index: number, step: Partial<RecipeStepFormData>) => {
    setFormData(prev => ({
      ...prev,
      steps: prev.steps.map((s, i) => i === index ? { ...s, ...step } : s)
    }));
  }, []);

  const addStep = useCallback(() => {
    setFormData(prev => ({
      ...prev,
      steps: [...prev.steps, { step: prev.steps.length + 1, description: '' }]
    }));
  }, []);

  const removeStep = useCallback((index: number) => {
    setFormData(prev => ({
      ...prev,
      steps: prev.steps
        .filter((_, i) => i !== index)
        .map((step, i) => ({ ...step, step: i + 1 }))
    }));
  }, []);

  const updateIngredient = useCallback((index: number, ingredient: Partial<RecipeIngredientFormData>) => {
    setFormData(prev => ({
      ...prev,
      ingredients: prev.ingredients.map((ing, i) => i === index ? { ...ing, ...ingredient } : ing)
    }));
  }, []);

  const addIngredient = useCallback(() => {
    setFormData(prev => ({
      ...prev,
      ingredients: [...prev.ingredients, {
        ingredient_id: '',
        amount: 0,
        is_optional: false,
        substitute_recommendation: null
      }]
    }));
  }, []);

  const removeIngredient = useCallback((index: number) => {
    setFormData(prev => ({
      ...prev,
      ingredients: prev.ingredients.filter((_, i) => i !== index)
    }));
  }, []);

  // Convert form data to API command
  const getUpdateCommand = useCallback((): UpdateRecipeCommand => {
    return {
      name: formData.name.trim(),
      preparation_time_minutes: formData.preparation_time_minutes,
      complexity_level: formData.complexity_level,
      steps: formData.steps.map(step => ({
        step: step.step,
        description: step.description.trim()
      })),
      ingredients: formData.ingredients.map(ing => ({
        ingredient_id: ing.ingredient_id,
        amount: ing.amount,
        is_optional: ing.is_optional,
        substitute_recommendation: ing.substitute_recommendation?.trim() || null
      }))
    };
  }, [formData]);

  // Reset form to initial state
  const resetForm = useCallback(() => {
    setFormData({
      name: initialRecipe.name,
      preparation_time_minutes: initialRecipe.preparation_time_minutes,
      complexity_level: initialRecipe.complexity_level,
      steps: initialRecipe.steps.map(step => ({
        step: step.step,
        description: step.description
      })),
      ingredients: initialRecipe.ingredients.map(ing => ({
        ingredient_id: ing.ingredient_id,
        amount: ing.amount,
        is_optional: ing.is_optional,
        substitute_recommendation: ing.substitute_recommendation
      }))
    });
    setValidationState({
      name: null,
      preparation_time_minutes: null,
      complexity_level: null,
      steps: [],
      ingredients: [],
      general: null
    });
  }, [initialRecipe]);

  // Check if form has changes
  const hasChanges = useCallback((): boolean => {
    const originalData = {
      name: initialRecipe.name,
      preparation_time_minutes: initialRecipe.preparation_time_minutes,
      complexity_level: initialRecipe.complexity_level,
      steps: initialRecipe.steps,
      ingredients: initialRecipe.ingredients
    };

    return JSON.stringify(formData) !== JSON.stringify({
      name: originalData.name,
      preparation_time_minutes: originalData.preparation_time_minutes,
      complexity_level: originalData.complexity_level,
      steps: originalData.steps.map(step => ({
        step: step.step,
        description: step.description
      })),
      ingredients: originalData.ingredients.map(ing => ({
        ingredient_id: ing.ingredient_id,
        amount: ing.amount,
        is_optional: ing.is_optional,
        substitute_recommendation: ing.substitute_recommendation
      }))
    });
  }, [formData, initialRecipe]);

  return {
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
    hasChanges: hasChanges()
  };
} 