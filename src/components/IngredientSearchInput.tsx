import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { IngredientDto } from '../types';
import { searchIngredients } from '../lib/api';

interface IngredientSearchInputProps {
  value: string;
  onChange: (ingredientId: string) => void;
  error?: string;
  disabled?: boolean;
  placeholder?: string;
}

const IngredientSearchInput: React.FC<IngredientSearchInputProps> = ({
  value,
  onChange,
  error,
  disabled = false,
  placeholder = "Wyszukaj składnik..."
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [suggestions, setSuggestions] = useState<IngredientDto[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedIngredient, setSelectedIngredient] = useState<IngredientDto | null>(null);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const debounceTimeoutRef = useRef<NodeJS.Timeout>();

  // Find selected ingredient when value changes
  useEffect(() => {
    if (value && !selectedIngredient) {
      // Try to find the ingredient in current suggestions first
      const found = suggestions.find(ing => ing.id === value);
      if (found) {
        setSelectedIngredient(found);
        setSearchTerm('');
      } else {
        // If not found in suggestions, we need to fetch it
        // For now, just clear the search term
        setSearchTerm('');
      }
    } else if (!value && selectedIngredient) {
      setSelectedIngredient(null);
      setSearchTerm('');
    }
  }, [value, selectedIngredient, suggestions]);

  // Debounced search function
  const performSearch = useCallback(async (query: string) => {
    if (query.length < 2) {
      setSuggestions([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const result = await searchIngredients(query, 1, 10);
      setSuggestions(result.data);
    } catch (error) {
      console.error('Error searching ingredients:', error);
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Handle search input changes
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchTerm(query);
    setShowDropdown(true);

    // Clear previous timeout
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    // Debounce search
    debounceTimeoutRef.current = setTimeout(() => {
      performSearch(query);
    }, 300);
  }, [performSearch]);

  // Handle ingredient selection
  const handleIngredientSelect = useCallback((ingredient: IngredientDto) => {
    setSelectedIngredient(ingredient);
    setSearchTerm('');
    setShowDropdown(false);
    onChange(ingredient.id);
  }, [onChange]);

  // Handle clearing selection
  const handleClearSelection = useCallback(() => {
    setSelectedIngredient(null);
    setSearchTerm('');
    onChange('');
    inputRef.current?.focus();
  }, [onChange]);

  // Handle input focus
  const handleInputFocus = useCallback(() => {
    if (!selectedIngredient) {
      setShowDropdown(true);
      if (searchTerm.length >= 2) {
        performSearch(searchTerm);
      }
    }
  }, [selectedIngredient, searchTerm, performSearch]);

  // Handle input blur
  const handleInputBlur = useCallback((e: React.FocusEvent) => {
    // Don't hide dropdown if clicking on dropdown item
    if (dropdownRef.current?.contains(e.relatedTarget as Node)) {
      return;
    }
    setTimeout(() => setShowDropdown(false), 200);
  }, []);

  // Handle keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setShowDropdown(false);
      inputRef.current?.blur();
    }
  }, []);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div className="relative">
      {selectedIngredient ? (
        // Show selected ingredient
        <div className={`flex items-center justify-between p-3 bg-gray-50 border rounded-lg ${
          error ? 'border-red-300' : 'border-gray-300'
        }`}>
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium text-gray-900">
              {selectedIngredient.name}
            </span>
            <span className="text-xs text-gray-500 bg-gray-200 px-2 py-1 rounded">
              {selectedIngredient.unit_type}
            </span>
          </div>
          <button
            type="button"
            onClick={handleClearSelection}
            disabled={disabled}
            className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
            aria-label="Usuń wybrany składnik"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      ) : (
        // Show search input
        <>
          <input
            ref={inputRef}
            type="text"
            value={searchTerm}
            onChange={handleSearchChange}
            onFocus={handleInputFocus}
            onBlur={handleInputBlur}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            placeholder={placeholder}
            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
              error 
                ? 'border-red-300 focus:border-red-500 bg-red-50' 
                : 'border-gray-300 focus:border-blue-500'
            } ${disabled ? 'bg-gray-100 cursor-not-allowed' : ''}`}
          />
          
          {/* Dropdown with suggestions */}
          {showDropdown && !disabled && (
            <div 
              ref={dropdownRef}
              className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto"
            >
              {isLoading ? (
                <div className="px-3 py-2 text-sm text-gray-500 text-center">
                  <div className="flex items-center justify-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                    <span>Wyszukiwanie...</span>
                  </div>
                </div>
              ) : suggestions.length > 0 ? (
                suggestions.map((ingredient) => (
                  <button
                    key={ingredient.id}
                    type="button"
                    onClick={() => handleIngredientSelect(ingredient)}
                    className="w-full text-left px-3 py-2 hover:bg-gray-100 focus:bg-gray-100 focus:outline-none transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-900">{ingredient.name}</span>
                      <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                        {ingredient.unit_type}
                      </span>
                    </div>
                  </button>
                ))
              ) : searchTerm.length >= 2 ? (
                <div className="px-3 py-2 text-sm text-gray-500 text-center">
                  Brak wyników dla "{searchTerm}"
                </div>
              ) : searchTerm.length > 0 ? (
                <div className="px-3 py-2 text-sm text-gray-500 text-center">
                  Wpisz co najmniej 2 znaki
                </div>
              ) : null}
            </div>
          )}
        </>
      )}
      
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
};

export default IngredientSearchInput; 