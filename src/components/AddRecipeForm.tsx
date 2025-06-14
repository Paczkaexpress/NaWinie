import React, { useState, useEffect, useCallback } from 'react';
import type { CreateRecipeFormData, FormValidationState, ImagePreview, IngredientDto } from '../types';
import BasicInfoSection from './BasicInfoSection';
import ImageUploader from './ImageUploader';
import IngredientsSection from './IngredientsSection';
import StepsSection from './StepsSection';

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
  const [imagePreview, setImagePreview] = useState<ImagePreview | null>(null);
  const [availableIngredients, setAvailableIngredients] = useState<IngredientDto[]>([]);
  const [loadingIngredients, setLoadingIngredients] = useState(true);

  // Fetch available ingredients on component mount
  useEffect(() => {
    const fetchIngredients = async () => {
      try {
        setLoadingIngredients(true);
        // TODO: Replace with actual API call
        // const response = await fetch('/api/ingredients?limit=100');
        // const data = await response.json();
        // setAvailableIngredients(data.data || []);
        
        // Mock data for now
        const mockIngredients: IngredientDto[] = [
          { id: '1', name: 'Mąka pszenna', unit_type: 'g', created_at: '', updated_at: '' },
          { id: '2', name: 'Jajka', unit_type: 'szt', created_at: '', updated_at: '' },
          { id: '3', name: 'Mleko', unit_type: 'ml', created_at: '', updated_at: '' },
          { id: '4', name: 'Masło', unit_type: 'g', created_at: '', updated_at: '' },
          { id: '5', name: 'Cukier', unit_type: 'g', created_at: '', updated_at: '' },
          { id: '6', name: 'Sól', unit_type: 'g', created_at: '', updated_at: '' },
          { id: '7', name: 'Cebula', unit_type: 'szt', created_at: '', updated_at: '' },
          { id: '8', name: 'Czosnek', unit_type: 'ząbki', created_at: '', updated_at: '' },
          { id: '9', name: 'Pomidory', unit_type: 'g', created_at: '', updated_at: '' },
          { id: '10', name: 'Oliwa z oliwek', unit_type: 'ml', created_at: '', updated_at: '' },
        ];
        setAvailableIngredients(mockIngredients);
      } catch (error) {
        console.error('Error fetching ingredients:', error);
        setErrors(prev => ({
          ...prev,
          general: 'Nie udało się pobrać listy składników. Spróbuj odświeżyć stronę.',
        }));
      } finally {
        setLoadingIngredients(false);
      }
    };

    fetchIngredients();
  }, []);

  const handleBasicInfoChange = useCallback((field: keyof CreateRecipeFormData, value: any) => {
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
  }, [errors]);

  const handleImageSelect = useCallback((file: File) => {
    // Validate file
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setErrors(prev => ({
        ...prev,
        image: 'Dozwolone formaty: JPEG, PNG, WebP',
      }));
      return;
    }

    const maxSize = 1024 * 1024; // 1MB
    if (file.size > maxSize) {
      setErrors(prev => ({
        ...prev,
        image: 'Plik jest za duży (max 1MB)',
      }));
      return;
    }

    // Clear any previous errors
    setErrors(prev => ({
      ...prev,
      image: null,
    }));

    // Create preview URL
    const url = URL.createObjectURL(file);
    setImagePreview({ file, url });
    setFormData(prev => ({
      ...prev,
      image: file,
    }));
  }, []);

  const handleImageRemove = useCallback(() => {
    if (imagePreview?.url) {
      URL.revokeObjectURL(imagePreview.url);
    }
    setImagePreview(null);
    setFormData(prev => ({
      ...prev,
      image: undefined,
    }));
    setErrors(prev => ({
      ...prev,
      image: null,
    }));
  }, [imagePreview]);

  const handleIngredientsChange = useCallback((ingredients: CreateRecipeFormData['ingredients']) => {
    setFormData(prev => ({
      ...prev,
      ingredients,
    }));
    
    // Clear validation errors for ingredients
    setErrors(prev => ({
      ...prev,
      ingredients: [],
    }));
  }, []);

  const handleStepsChange = useCallback((steps: CreateRecipeFormData['steps']) => {
    setFormData(prev => ({
      ...prev,
      steps,
    }));
    
    // Clear validation errors for steps
    setErrors(prev => ({
      ...prev,
      steps: [],
    }));
  }, []);

  const validateForm = useCallback((): boolean => {
    const newErrors: FormValidationState = {
      name: null,
      preparation_time_minutes: null,
      complexity_level: null,
      steps: [],
      ingredients: [],
      image: null,
      general: null,
    };

    let isValid = true;

    // Validate basic info
    if (!formData.name.trim()) {
      newErrors.name = 'Nazwa przepisu jest wymagana';
      isValid = false;
    } else if (formData.name.length > 100) {
      newErrors.name = 'Nazwa przepisu nie może być dłuższa niż 100 znaków';
      isValid = false;
    }

    if (formData.preparation_time_minutes <= 0) {
      newErrors.preparation_time_minutes = 'Czas przygotowania musi być większy niż 0';
      isValid = false;
    } else if (formData.preparation_time_minutes > 999) {
      newErrors.preparation_time_minutes = 'Czas przygotowania nie może być większy niż 999 minut';
      isValid = false;
    }

    // Validate ingredients
    if (formData.ingredients.length === 0) {
      newErrors.general = 'Przepis musi zawierać co najmniej jeden składnik';
      isValid = false;
    } else {
      newErrors.ingredients = formData.ingredients.map(ingredient => {
        const ingredientErrors: any = {
          ingredient_id: null,
          amount: null,
          substitute_recommendation: null,
        };

        if (!ingredient.ingredient_id) {
          ingredientErrors.ingredient_id = 'Wybierz składnik';
          isValid = false;
        }

        if (ingredient.amount <= 0) {
          ingredientErrors.amount = 'Ilość musi być większa niż 0';
          isValid = false;
        }

        if (ingredient.substitute_recommendation && ingredient.substitute_recommendation.length > 100) {
          ingredientErrors.substitute_recommendation = 'Opis zamiennika nie może być dłuższy niż 100 znaków';
          isValid = false;
        }

        return ingredientErrors;
      });
    }

    // Validate steps
    if (formData.steps.length === 0) {
      if (!newErrors.general) {
        newErrors.general = 'Przepis musi zawierać co najmniej jeden krok';
      }
      isValid = false;
    } else {
      newErrors.steps = formData.steps.map(step => {
        if (!step.description.trim()) {
          isValid = false;
          return 'Opis kroku jest wymagany';
        }
        if (step.description.length > 500) {
          isValid = false;
          return 'Opis kroku nie może być dłuższy niż 500 znaków';
        }
        return null;
      });
    }

    setErrors(newErrors);
    return isValid;
  }, [formData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    
    try {
      // TODO: Implement actual API call
      console.log('Form data:', formData);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
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
    window.history.back();
  };

  // Cleanup image preview URLs on unmount
  useEffect(() => {
    return () => {
      if (imagePreview?.url) {
        URL.revokeObjectURL(imagePreview.url);
      }
    };
  }, [imagePreview]);

  if (loadingIngredients) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        <span className="ml-2 text-gray-600">Ładowanie składników...</span>
      </div>
    );
  }

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

      {/* Image Upload Section */}
      <ImageUploader
        onImageSelect={handleImageSelect}
        onImageRemove={handleImageRemove}
        preview={imagePreview}
        error={errors.image}
      />

      {/* Ingredients Section */}
      <IngredientsSection
        ingredients={formData.ingredients}
        onIngredientsChange={handleIngredientsChange}
        availableIngredients={availableIngredients}
        errors={errors.ingredients}
      />

      {/* Steps Section */}
      <StepsSection
        steps={formData.steps}
        onStepsChange={handleStepsChange}
        errors={errors.steps}
      />

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