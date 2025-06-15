import React from 'react';

export interface BasicInfoSectionProps {
  name: string;
  preparationTime: number;
  complexityLevel: 'easy' | 'medium' | 'hard';
  nameError: string | null;
  preparationTimeError: string | null;
  onUpdateName: (name: string) => void;
  onUpdatePreparationTime: (time: number) => void;
  onUpdateComplexityLevel: (level: 'easy' | 'medium' | 'hard') => void;
}

const BasicInfoSection: React.FC<BasicInfoSectionProps> = ({
  name,
  preparationTime,
  complexityLevel,
  nameError,
  preparationTimeError,
  onUpdateName,
  onUpdatePreparationTime,
  onUpdateComplexityLevel
}) => {
  const complexityOptions = [
    { value: 'easy', label: 'Łatwy' },
    { value: 'medium', label: 'Średni' },
    { value: 'hard', label: 'Trudny' }
  ];

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Podstawowe informacje
      </h3>
      
      <div className="space-y-4">
        {/* Recipe Name */}
        <div>
          <label htmlFor="recipeName" className="block text-sm font-medium text-gray-700 mb-1">
            Nazwa przepisu *
          </label>
          <input
            type="text"
            id="recipeName"
            value={name}
            onChange={(e) => onUpdateName(e.target.value)}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
              nameError ? 'border-red-300 bg-red-50' : 'border-gray-300'
            }`}
            placeholder="Wprowadź nazwę przepisu"
            maxLength={255}
          />
          {nameError && (
            <p className="mt-1 text-sm text-red-600">{nameError}</p>
          )}
          <p className="mt-1 text-sm text-gray-500">
            {name.length}/255 znaków
          </p>
        </div>

        {/* Preparation Time and Complexity Level */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Preparation Time */}
          <div>
            <label htmlFor="preparationTime" className="block text-sm font-medium text-gray-700 mb-1">
              Czas przygotowania (minuty) *
            </label>
            <input
              type="number"
              id="preparationTime"
              value={preparationTime}
              onChange={(e) => onUpdatePreparationTime(Number(e.target.value))}
              min="1"
              max="9999"
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                preparationTimeError ? 'border-red-300 bg-red-50' : 'border-gray-300'
              }`}
              placeholder="np. 30"
            />
            {preparationTimeError && (
              <p className="mt-1 text-sm text-red-600">{preparationTimeError}</p>
            )}
          </div>

          {/* Complexity Level */}
          <div>
            <label htmlFor="complexityLevel" className="block text-sm font-medium text-gray-700 mb-1">
              Poziom trudności *
            </label>
            <select
              id="complexityLevel"
              value={complexityLevel}
              onChange={(e) => onUpdateComplexityLevel(e.target.value as 'easy' | 'medium' | 'hard')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            >
              {complexityOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BasicInfoSection; 