import React, { useCallback } from 'react';
import type { RecipeStepFormData } from '../types';

interface StepInputProps {
  step: RecipeStepFormData;
  onChange: (step: RecipeStepFormData) => void;
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  error: string | null;
  canMoveUp: boolean;
  canMoveDown: boolean;
}

const StepInput: React.FC<StepInputProps> = React.memo(({
  step,
  onChange,
  onRemove,
  onMoveUp,
  onMoveDown,
  error,
  canMoveUp,
  canMoveDown
}) => {
  const handleDescriptionChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange({
      ...step,
      description: e.target.value,
    });
  }, [step, onChange]);

  return (
    <div className="flex gap-4 p-4 border border-gray-200 rounded-lg">
      {/* Step number */}
      <div className="flex-shrink-0">
        <div className="w-8 h-8 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center text-sm font-medium">
          {step.step}
        </div>
      </div>

      {/* Step description */}
      <div className="flex-grow">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Opis kroku {step.step} <span className="text-red-500">*</span>
        </label>
        <textarea
          value={step.description}
          onChange={handleDescriptionChange}
          placeholder={`Opisz krok ${step.step}, np. "Pokrój cebulę w kostki i podsmaż na patelni"`}
          maxLength={500}
          rows={3}
          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none ${
            error 
              ? 'border-red-300 focus:border-red-500' 
              : 'border-gray-300 focus:border-blue-500'
          }`}
        />
        {error && (
          <p className="mt-1 text-sm text-red-600">{error}</p>
        )}
        <p className="mt-1 text-xs text-gray-500">
          {step.description.length}/500 znaków
        </p>
      </div>

      {/* Action buttons */}
      <div className="flex-shrink-0 flex flex-col gap-1">
        {/* Move up button */}
        <button
          type="button"
          onClick={onMoveUp}
          disabled={!canMoveUp}
          className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
          title="Przesuń w górę"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
          </svg>
        </button>

        {/* Move down button */}
        <button
          type="button"
          onClick={onMoveDown}
          disabled={!canMoveDown}
          className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
          title="Przesuń w dół"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {/* Remove button */}
        <button
          type="button"
          onClick={onRemove}
          className="p-1 text-red-400 hover:text-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 rounded"
          title="Usuń krok"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
    </div>
  );
});

StepInput.displayName = 'StepInput';

export default StepInput; 