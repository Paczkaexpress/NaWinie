import React, { useCallback } from 'react';
import type { BasicRecipeInfo } from '../types';

interface BasicInfoSectionProps {
  values: BasicRecipeInfo;
  onChange: (field: keyof BasicRecipeInfo, value: any) => void;
  errors: {
    name: string | null;
    preparation_time_minutes: string | null;
    complexity_level: string | null;
  };
}

const BasicInfoSection: React.FC<BasicInfoSectionProps> = React.memo(({ values, onChange, errors }) => {
  const handleNameChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    onChange('name', e.target.value);
  }, [onChange]);

  const handleTimeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value) || 0;
    onChange('preparation_time_minutes', value);
  }, [onChange]);

  const handleComplexityChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    onChange('complexity_level', e.target.value as 'easy' | 'medium' | 'hard');
  }, [onChange]);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Podstawowe informacje</h3>
        
        {/* Recipe Name */}
        <div className="mb-4">
          <label htmlFor="recipe-name" className="block text-sm font-medium text-gray-700 mb-2">
            Nazwa przepisu <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="recipe-name"
            value={values.name}
            onChange={handleNameChange}
            placeholder="Np. Spaghetti Carbonara"
            maxLength={100}
            className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.name 
                ? 'border-red-300 focus:border-red-500' 
                : 'border-gray-300 focus:border-blue-500'
            }`}
          />
          {errors.name && (
            <p className="mt-1 text-sm text-red-600">{errors.name}</p>
          )}
          <p className="mt-1 text-xs text-gray-500">
            {values.name.length}/100 znaków
          </p>
        </div>

        {/* Preparation Time */}
        <div className="mb-4">
          <label htmlFor="preparation-time" className="block text-sm font-medium text-gray-700 mb-2">
            Czas przygotowania (minuty) <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            id="preparation-time"
            value={values.preparation_time_minutes || ''}
            onChange={handleTimeChange}
            placeholder="30"
            min="1"
            max="999"
            className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.preparation_time_minutes 
                ? 'border-red-300 focus:border-red-500' 
                : 'border-gray-300 focus:border-blue-500'
            }`}
          />
          {errors.preparation_time_minutes && (
            <p className="mt-1 text-sm text-red-600">{errors.preparation_time_minutes}</p>
          )}
        </div>

        {/* Complexity Level */}
        <div className="mb-4">
          <label htmlFor="complexity-level" className="block text-sm font-medium text-gray-700 mb-2">
            Poziom trudności <span className="text-red-500">*</span>
          </label>
          <select
            id="complexity-level"
            value={values.complexity_level}
            onChange={handleComplexityChange}
            className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.complexity_level 
                ? 'border-red-300 focus:border-red-500' 
                : 'border-gray-300 focus:border-blue-500'
            }`}
          >
            <option value="easy">Łatwy</option>
            <option value="medium">Średni</option>
            <option value="hard">Trudny</option>
          </select>
          {errors.complexity_level && (
            <p className="mt-1 text-sm text-red-600">{errors.complexity_level}</p>
          )}
        </div>
      </div>
    </div>
  );
});

BasicInfoSection.displayName = 'BasicInfoSection';

export default BasicInfoSection; 