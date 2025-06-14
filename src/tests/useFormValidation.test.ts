/// <reference types="vitest/globals" />
import { renderHook, act } from '@testing-library/react';
import { useFormValidation } from '../hooks/useFormValidation';
import type { CreateRecipeFormData } from '../types';

describe('useFormValidation', () => {
  const mockFormData: CreateRecipeFormData = {
    name: '',
    preparation_time_minutes: 0,
    complexity_level: 'easy',
    steps: [],
    ingredients: [],
    image: undefined,
  };

  it('should initialize with no errors', () => {
    const { result } = renderHook(() => useFormValidation());
    
    expect(result.current.errors.name).toBeNull();
    expect(result.current.errors.preparation_time_minutes).toBeNull();
    expect(result.current.errors.complexity_level).toBeNull();
    expect(result.current.errors.general).toBeNull();
    expect(result.current.isValid).toBeTruthy(); // Form starts as valid until validation runs
  });

  it('should validate name field correctly', () => {
    const { result } = renderHook(() => useFormValidation());
    
    // Test empty name
    let nameError = result.current.validateField('name', '');
    expect(nameError).toBe('Nazwa przepisu jest wymagana');
    
    // Test valid name
    nameError = result.current.validateField('name', 'Test Recipe');
    expect(nameError).toBeNull();
    
    // Test name too long
    const longName = 'a'.repeat(101);
    nameError = result.current.validateField('name', longName);
    expect(nameError).toBe('Nazwa przepisu nie może być dłuższa niż 100 znaków');
  });

  it('should validate preparation time correctly', () => {
    const { result } = renderHook(() => useFormValidation());
    
    // Test zero time
    let timeError = result.current.validateField('preparation_time_minutes', 0);
    expect(timeError).toBe('Czas przygotowania musi być większy niż 0');
    
    // Test valid time
    timeError = result.current.validateField('preparation_time_minutes', 30);
    expect(timeError).toBeNull();
    
    // Test time too large
    timeError = result.current.validateField('preparation_time_minutes', 1000);
    expect(timeError).toBe('Czas przygotowania nie może być większy niż 999 minut');
  });

  it('should validate complete form correctly', () => {
    const { result } = renderHook(() => useFormValidation());
    
    // Test empty form
    act(() => {
      const isValid = result.current.validateForm(mockFormData);
      expect(isValid).toBeFalsy();
    });
    
    expect(result.current.errors.general).toBe('Przepis musi zawierać co najmniej jeden składnik');

    // Test valid form  
    const validFormData: CreateRecipeFormData = {
      name: 'Test Recipe',
      preparation_time_minutes: 30,
      complexity_level: 'easy',
      steps: [{ step: 1, description: 'First step' }],
      ingredients: [{ 
        ingredient_id: '1', 
        amount: 100, 
        is_optional: false, 
        substitute_recommendation: null 
      }],
      image: undefined,
    };

    act(() => {
      const isValid = result.current.validateForm(validFormData);
      expect(isValid).toBeTruthy();
    });
    
    expect(result.current.errors.general).toBeNull();
  });

  it('should clear errors correctly', () => {
    const { result } = renderHook(() => useFormValidation());
    
    // First validate to create errors
    act(() => {
      result.current.validateForm(mockFormData);
    });
    
    expect(result.current.errors.general).not.toBeNull();
    
    // Clear errors
    act(() => {
      result.current.clearErrors();
    });
    
    expect(result.current.errors.general).toBeNull();
    expect(result.current.errors.name).toBeNull();
  });

  it('should clear specific field errors', () => {
    const { result } = renderHook(() => useFormValidation());
    
    // First validate to create errors
    act(() => {
      result.current.validateForm(mockFormData);
    });
    
    expect(result.current.errors.name).not.toBeNull();
    
    // Clear specific field error
    act(() => {
      result.current.clearFieldError('name');
    });
    
    expect(result.current.errors.name).toBeNull();
    expect(result.current.errors.general).not.toBeNull(); // Other errors should remain
  });
}); 