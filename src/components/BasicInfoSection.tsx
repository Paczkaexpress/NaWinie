import React from 'react';

export interface BasicInfoSectionProps {
  values: {
    name: string;
    preparation_time_minutes: number;
    complexity_level: 'easy' | 'medium' | 'hard';
  };
  onChange: (field: string, value: any) => void;
  errors: {
    name?: string | null;
    preparation_time_minutes?: string | null;
    complexity_level?: string | null;
  };
}

const BasicInfoSection: React.FC<BasicInfoSectionProps> = ({
  values,
  onChange,
  errors
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
            value={values.name || ''}
            onChange={(e) => onChange('name', e.target.value)}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
              errors.name ? 'border-red-300 bg-red-50' : 'border-gray-300'
            }`}
            placeholder="Wprowadź nazwę przepisu"
            maxLength={255}
          />
          {errors.name && (
            <p className="mt-1 text-sm text-red-600">{errors.name}</p>
          )}
          <p className="mt-1 text-sm text-gray-500">
            {(values.name || '').length}/255 znaków
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
              value={values.preparation_time_minutes || ''}
              onChange={(e) => onChange('preparation_time_minutes', Number(e.target.value))}
              min="1"
              max="9999"
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                errors.preparation_time_minutes ? 'border-red-300 bg-red-50' : 'border-gray-300'
              }`}
              placeholder="np. 30"
            />
            {errors.preparation_time_minutes && (
              <p className="mt-1 text-sm text-red-600">{errors.preparation_time_minutes}</p>
            )}
          </div>

          {/* Complexity Level */}
          <div>
            <label htmlFor="complexityLevel" className="block text-sm font-medium text-gray-700 mb-1">
              Poziom trudności *
            </label>
            <select
              id="complexityLevel"
              key={`complexity-${values.complexity_level}`}
              defaultValue={values.complexity_level || 'easy'}
              onChange={(e) => {
                const selectedValue = e.target.value as 'easy' | 'medium' | 'hard';
                onChange('complexity_level', selectedValue);
              }}
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