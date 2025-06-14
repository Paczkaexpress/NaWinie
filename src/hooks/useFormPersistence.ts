import { useEffect, useCallback, useRef } from 'react';
import type { CreateRecipeFormData } from '../types';

const FORM_STORAGE_KEY = 'add_recipe_form_backup';
const SAVE_DELAY = 1000; // Save after 1 second of inactivity

interface UseFormPersistenceOptions {
  formData: CreateRecipeFormData;
  autoSave?: boolean;
}

interface UseFormPersistenceReturn {
  saveFormData: () => void;
  loadFormData: () => CreateRecipeFormData | null;
  clearFormData: () => void;
  hasSavedData: boolean;
}

export const useFormPersistence = ({ 
  formData, 
  autoSave = true 
}: UseFormPersistenceOptions): UseFormPersistenceReturn => {
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const previousDataRef = useRef<string>('');

  const saveFormData = useCallback(() => {
    try {
      // Only save if form has meaningful data
      const hasData = 
        formData.name.trim() ||
        formData.preparation_time_minutes > 0 ||
        formData.ingredients.length > 0 ||
        formData.steps.length > 0;

      if (hasData) {
        // Create a serializable version (exclude File objects)
        const dataToSave = {
          ...formData,
          image: undefined, // Don't save file objects
        };
        
        const serializedData = JSON.stringify(dataToSave);
        
        // Only save if data actually changed
        if (serializedData !== previousDataRef.current) {
          localStorage.setItem(FORM_STORAGE_KEY, serializedData);
          previousDataRef.current = serializedData;
          console.log('Form data saved to localStorage');
        }
      } else {
        // Clear storage if no meaningful data
        localStorage.removeItem(FORM_STORAGE_KEY);
        previousDataRef.current = '';
      }
    } catch (error) {
      console.error('Error saving form data:', error);
    }
  }, [formData]);

  const loadFormData = useCallback((): CreateRecipeFormData | null => {
    try {
      const savedData = localStorage.getItem(FORM_STORAGE_KEY);
      if (!savedData) return null;

      const parsedData = JSON.parse(savedData);
      
      // Validate the structure
      if (
        typeof parsedData === 'object' &&
        parsedData !== null &&
        typeof parsedData.name === 'string' &&
        typeof parsedData.preparation_time_minutes === 'number' &&
        Array.isArray(parsedData.ingredients) &&
        Array.isArray(parsedData.steps)
      ) {
        return {
          name: parsedData.name || '',
          preparation_time_minutes: parsedData.preparation_time_minutes || 0,
          complexity_level: parsedData.complexity_level || 'easy',
          ingredients: parsedData.ingredients || [],
          steps: parsedData.steps || [],
          image: undefined, // Never restore file objects
        };
      }
      
      return null;
    } catch (error) {
      console.error('Error loading form data:', error);
      // Clear corrupted data
      localStorage.removeItem(FORM_STORAGE_KEY);
      return null;
    }
  }, []);

  const clearFormData = useCallback(() => {
    try {
      localStorage.removeItem(FORM_STORAGE_KEY);
      previousDataRef.current = '';
      console.log('Form data cleared from localStorage');
    } catch (error) {
      console.error('Error clearing form data:', error);
    }
  }, []);

  const hasSavedData = useCallback((): boolean => {
    try {
      const savedData = localStorage.getItem(FORM_STORAGE_KEY);
      return !!savedData;
    } catch (error) {
      return false;
    }
  }, []);

  // Auto-save effect
  useEffect(() => {
    if (!autoSave) return;

    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Set new timeout for debounced save
    saveTimeoutRef.current = setTimeout(() => {
      saveFormData();
    }, SAVE_DELAY);

    // Cleanup timeout on unmount
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [formData, autoSave, saveFormData]);

  // Save on page unload
  useEffect(() => {
    const handleBeforeUnload = () => {
      saveFormData();
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [saveFormData]);

  return {
    saveFormData,
    loadFormData,
    clearFormData,
    hasSavedData: hasSavedData(),
  };
}; 