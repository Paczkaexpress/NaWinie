import React from 'react';
import type { 
  EditRecipeFormData, 
  EditFormValidationState, 
  RecipeStepFormData, 
  RecipeIngredientFormData 
} from '../types';
import BasicInfoSection from './BasicInfoSection';
import IngredientsSection from './IngredientsSection';
import StepsSection from './StepsSection';

interface EditRecipeFormProps {
  formData: EditRecipeFormData;
  validationState: EditFormValidationState;
  onUpdateName: (name: string) => void;
  onUpdatePreparationTime: (time: number) => void;
  onUpdateComplexityLevel: (level: 'EASY' | 'MEDIUM' | 'HARD') => void;
  onUpdateStep: (index: number, step: Partial<RecipeStepFormData>) => void;
  onAddStep: () => void;
  onRemoveStep: (index: number) => void;
  onUpdateIngredient: (index: number, ingredient: Partial<RecipeIngredientFormData>) => void;
  onAddIngredient: () => void;
  onRemoveIngredient: (index: number) => void;
}

const EditRecipeForm: React.FC<EditRecipeFormProps> = ({
  formData,
  validationState,
  onUpdateName,
  onUpdatePreparationTime,
  onUpdateComplexityLevel,
  onUpdateStep,
  onAddStep,
  onRemoveStep,
  onUpdateIngredient,
  onAddIngredient,
  onRemoveIngredient
}) => {
  return (
    <div className="space-y-8">
      {/* Basic Information Section */}
      <BasicInfoSection
        name={formData.name}
        preparationTime={formData.preparation_time_minutes}
        complexityLevel={formData.complexity_level}
        nameError={validationState.name}
        preparationTimeError={validationState.preparation_time_minutes}
        onUpdateName={onUpdateName}
        onUpdatePreparationTime={onUpdatePreparationTime}
        onUpdateComplexityLevel={onUpdateComplexityLevel}
      />

      {/* Ingredients Section */}
      <IngredientsSection
        ingredients={formData.ingredients}
        onIngredientsChange={(ingredients) => {
          // Convert individual ingredient updates to batch update
          ingredients.forEach((ingredient, index) => {
            onUpdateIngredient(index, ingredient);
          });
        }}
        errors={{ ingredients: validationState.ingredients }}
      />

      {/* Steps Section */}
      <StepsSection
        steps={formData.steps}
        validationErrors={validationState.steps}
        onUpdateStep={onUpdateStep}
        onAddStep={onAddStep}
        onRemoveStep={onRemoveStep}
      />
    </div>
  );
};

export default EditRecipeForm; 