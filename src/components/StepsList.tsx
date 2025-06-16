import React, { useRef, useEffect, useState } from 'react';
import type { RecipeStep } from '../types';

interface StepItemProps {
  step: RecipeStep;
  isActive?: boolean;
}

function StepItem({ step, isActive = false }: StepItemProps) {
  const { step: stepNumber, description } = step;

  return (
    <li 
      className={`flex items-start py-4 px-4 rounded-lg transition-colors duration-200 ${
        isActive ? 'bg-blue-50 border border-blue-200' : 'bg-white hover:bg-gray-50'
      }`}
    >
      <div 
        className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold mr-4 ${
          isActive 
            ? 'bg-blue-600 text-white' 
            : 'bg-gray-100 text-gray-700'
        }`}
      >
        {stepNumber}
      </div>
      <div className="flex-1">
        <p className={`text-gray-900 leading-relaxed ${isActive ? 'font-MEDIUM' : ''}`}>
          {description}
        </p>
      </div>
    </li>
  );
}

interface StepsListProps {
  steps: RecipeStep[];
  className?: string;
}

export default function StepsList({ steps, className = '' }: StepsListProps) {
  const [activeStep, setActiveStep] = useState<number | null>(null);
  const stepsRef = useRef<HTMLOListElement>(null);

  // Handle scroll to highlight current step
  useEffect(() => {
    const handleScroll = () => {
      if (!stepsRef.current) return;

      const stepElements = stepsRef.current.querySelectorAll('li');
      const scrollPosition = window.scrollY + window.innerHeight / 2;

      let currentActiveStep: number | null = null;

      stepElements.forEach((element, index) => {
        const rect = element.getBoundingClientRect();
        const elementTop = rect.top + window.scrollY;
        const elementBottom = elementTop + rect.height;

        if (scrollPosition >= elementTop && scrollPosition <= elementBottom) {
          currentActiveStep = index + 1;
        }
      });

      setActiveStep(currentActiveStep);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Check initial position

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (!steps || steps.length === 0) {
    return (
      <div className={`bg-gray-50 rounded-lg p-6 text-center ${className}`}>
        <p className="text-gray-500">Brak kroków do wyświetlenia</p>
      </div>
    );
  }

  // Sort steps by step number to ensure correct order
  const sortedSteps = [...steps].sort((a, b) => a.step - b.step);

  return (
    <div className={`bg-white rounded-lg shadow-sm border ${className}`}>
      <div className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
          <svg 
            className="w-6 h-6 mr-2 text-orange-600" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" 
            />
          </svg>
          Sposób przygotowania ({steps.length} {steps.length === 1 ? 'krok' : 'kroków'})
        </h2>
        
        <ol ref={stepsRef} className="space-y-2">
          {sortedSteps.map((step) => (
            <StepItem 
              key={step.step} 
              step={step} 
              isActive={activeStep === step.step}
            />
          ))}
        </ol>
        
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-800">
            <svg 
              className="w-4 h-4 inline mr-1" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
              />
            </svg>
            <strong>Wskazówka:</strong> Przeczytaj wszystkie kroki przed rozpoczęciem gotowania.
          </p>
        </div>
      </div>
    </div>
  );
}