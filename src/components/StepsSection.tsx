import React from 'react';
import type { RecipeStepFormData } from '../types';

export interface StepsSectionProps {
  steps: RecipeStepFormData[];
  validationErrors: Array<string | null>;
  onUpdateStep: (index: number, step: Partial<RecipeStepFormData>) => void;
  onAddStep: () => void;
  onRemoveStep: (index: number) => void;
}

const StepsSection: React.FC<StepsSectionProps> = ({
  steps,
  validationErrors,
  onUpdateStep,
  onAddStep,
  onRemoveStep
}) => {
  const moveStepUp = (index: number) => {
    if (index === 0) return;
    
    // Swap steps
    const step1 = steps[index];
    const step2 = steps[index - 1];
    
    onUpdateStep(index, { step: step2.step, description: step2.description });
    onUpdateStep(index - 1, { step: step1.step, description: step1.description });
  };

  const moveStepDown = (index: number) => {
    if (index === steps.length - 1) return;
    
    // Swap steps
    const step1 = steps[index];
    const step2 = steps[index + 1];
    
    onUpdateStep(index, { step: step2.step, description: step2.description });
    onUpdateStep(index + 1, { step: step1.step, description: step1.description });
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          Sposób przygotowania ({steps.length} {steps.length === 1 ? 'krok' : 'kroków'})
        </h3>
        <button
          type="button"
          onClick={onAddStep}
          className="flex items-center px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Dodaj krok
        </button>
      </div>

      {steps.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
          </svg>
          <p>Brak kroków. Kliknij "Dodaj krok" aby dodać pierwszy krok.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {steps.map((step, index) => {
            const error = validationErrors[index];
            
            return (
              <div key={index} className="p-4 border border-gray-200 rounded-lg bg-gray-50">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-semibold text-sm">
                      {step.step}
                    </div>
                    <span className="text-sm font-medium text-gray-700">
                      Krok {step.step}
                    </span>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {/* Move up button */}
                    <button
                      type="button"
                      onClick={() => moveStepUp(index)}
                      disabled={index === 0}
                      className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      title="Przenieś w górę"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                      </svg>
                    </button>
                    
                    {/* Move down button */}
                    <button
                      type="button"
                      onClick={() => moveStepDown(index)}
                      disabled={index === steps.length - 1}
                      className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      title="Przenieś w dół"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    
                    {/* Remove button */}
                    <button
                      type="button"
                      onClick={() => onRemoveStep(index)}
                      className="p-1 text-red-600 hover:text-red-700 transition-colors"
                      title="Usuń krok"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Step description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Opis kroku *
                  </label>
                  <textarea
                    value={step.description}
                    onChange={(e) => onUpdateStep(index, { description: e.target.value })}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none ${
                      error ? 'border-red-300 bg-red-50' : 'border-gray-300'
                    }`}
                    placeholder="Opisz szczegółowo ten krok przygotowania..."
                    rows={3}
                    maxLength={1000}
                  />
                  {error && (
                    <p className="mt-1 text-sm text-red-600">{error}</p>
                  )}
                  <div className="flex justify-between items-center mt-1">
                    <p className="text-sm text-gray-500">
                      {step.description.length}/1000 znaków
                    </p>
                    {step.description.length > 800 && (
                      <span className="text-xs text-amber-600">
                        Zbliżasz się do limitu znaków
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Help text */}
      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-start">
          <svg className="w-5 h-5 text-blue-600 mt-0.5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div className="text-sm text-blue-700">
            <p className="font-medium mb-1">Wskazówki:</p>
            <ul className="space-y-1 text-sm">
              <li>• Opisuj kroki możliwie szczegółowo</li>
              <li>• Używaj przycisków strzałek aby zmienić kolejność kroków</li>
              <li>• Każdy krok powinien być jasny i zrozumiały</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StepsSection; 