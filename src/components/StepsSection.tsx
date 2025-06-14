import React, { useCallback, useEffect } from 'react';
import type { RecipeStepFormData } from '../types';
import StepInput from './StepInput';

interface StepsSectionProps {
  steps: RecipeStepFormData[];
  onStepsChange: (steps: RecipeStepFormData[]) => void;
  errors: Array<string | null>;
}

const StepsSection: React.FC<StepsSectionProps> = React.memo(({
  steps,
  onStepsChange,
  errors
}) => {
  const createNewStep = useCallback((stepNumber: number): RecipeStepFormData => ({
    step: stepNumber,
    description: '',
  }), []);

  const reorderSteps = useCallback((stepsList: RecipeStepFormData[]): RecipeStepFormData[] => {
    return stepsList.map((step, index) => ({
      ...step,
      step: index + 1,
    }));
  }, []);

  const handleAddStep = useCallback(() => {
    const newStep = createNewStep(steps.length + 1);
    onStepsChange([...steps, newStep]);
  }, [steps, onStepsChange, createNewStep]);

  const handleStepChange = useCallback((index: number, updatedStep: RecipeStepFormData) => {
    const newSteps = [...steps];
    newSteps[index] = updatedStep;
    onStepsChange(newSteps);
  }, [steps, onStepsChange]);

  const handleRemoveStep = useCallback((index: number) => {
    const newSteps = steps.filter((_, i) => i !== index);
    const reorderedSteps = reorderSteps(newSteps);
    onStepsChange(reorderedSteps);
  }, [steps, onStepsChange, reorderSteps]);

  const handleMoveStepUp = useCallback((index: number) => {
    if (index === 0) return;
    
    const newSteps = [...steps];
    [newSteps[index - 1], newSteps[index]] = [newSteps[index], newSteps[index - 1]];
    const reorderedSteps = reorderSteps(newSteps);
    onStepsChange(reorderedSteps);
  }, [steps, onStepsChange, reorderSteps]);

  const handleMoveStepDown = useCallback((index: number) => {
    if (index === steps.length - 1) return;
    
    const newSteps = [...steps];
    [newSteps[index], newSteps[index + 1]] = [newSteps[index + 1], newSteps[index]];
    const reorderedSteps = reorderSteps(newSteps);
    onStepsChange(reorderedSteps);
  }, [steps, onStepsChange, reorderSteps]);

  // Ensure at least one step input is present
  useEffect(() => {
    if (steps.length === 0) {
      onStepsChange([createNewStep(1)]);
    }
  }, [steps.length, onStepsChange, createNewStep]);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Kroki przygotowania <span className="text-red-500">*</span>
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          Opisz kolejne kroki przygotowania przepisu
        </p>

        <div className="space-y-4">
          {steps.map((step, index) => (
            <StepInput
              key={`step-${index}`}
              step={step}
              onChange={(updatedStep) => handleStepChange(index, updatedStep)}
              onRemove={() => handleRemoveStep(index)}
              onMoveUp={() => handleMoveStepUp(index)}
              onMoveDown={() => handleMoveStepDown(index)}
              error={errors[index] || null}
              canMoveUp={index > 0}
              canMoveDown={index < steps.length - 1}
            />
          ))}
        </div>

        <button
          type="button"
          onClick={handleAddStep}
          className="mt-4 inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <svg
            className="mr-2 h-4 w-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 6v6m0 0v6m0-6h6m-6 0H6"
            />
          </svg>
          Dodaj krok
        </button>

        {steps.length === 0 && (
          <p className="mt-2 text-sm text-red-600">
            Przepis musi zawierać co najmniej jeden krok
          </p>
        )}

        {steps.length > 0 && (
          <div className="mt-2 text-sm text-gray-500">
            <p>💡 Użyj strzałek aby zmienić kolejność kroków</p>
          </div>
        )}
      </div>
    </div>
  );
});

StepsSection.displayName = 'StepsSection';

export default StepsSection; 