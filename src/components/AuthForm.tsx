import React, { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';

interface AuthFormData {
  email: string;
  password: string;
  confirmPassword?: string;
}

interface AuthFormProps {
  onSubmit: (data: AuthFormData) => Promise<void>;
  isLoading?: boolean;
  error?: string;
}

export const AuthForm: React.FC<AuthFormProps> = ({ onSubmit, isLoading = false, error }) => {
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [formData, setFormData] = useState<AuthFormData>({
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear validation error when user starts typing
    if (validationErrors[name]) {
      setValidationErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.email) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Please enter a valid email address';
    }

    if (!formData.password) {
      errors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters long';
    }

    if (!isLoginMode) {
      if (!formData.confirmPassword) {
        errors.confirmPassword = 'Please confirm your password';
      } else if (formData.password !== formData.confirmPassword) {
        errors.confirmPassword = 'Passwords do not match';
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    try {
      await onSubmit(formData);
    } catch (error) {
      // Error handling is done in parent component
      console.error('Auth error:', error);
    }
  };

  const toggleMode = () => {
    setIsLoginMode(!isLoginMode);
    setValidationErrors({});
    setFormData({
      email: '',
      password: '',
      confirmPassword: ''
    });
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-center">
          {isLoginMode ? 'Zaloguj się' : 'Zarejestruj się'}
        </CardTitle>
        <CardDescription className="text-center">
          {isLoginMode 
            ? 'Wprowadź swoje dane aby się zalogować' 
            : 'Utwórz nowe konto aby rozpocząć'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 text-sm text-red-600 bg-red-50 rounded-md border border-red-200">
              {error}
            </div>
          )}
          
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="twoj@email.com"
              value={formData.email}
              onChange={handleInputChange}
              className={validationErrors.email ? 'border-red-500' : ''}
            />
            {validationErrors.email && (
              <p className="text-sm text-red-600">{validationErrors.email}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Hasło</Label>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="Wprowadź hasło"
              value={formData.password}
              onChange={handleInputChange}
              className={validationErrors.password ? 'border-red-500' : ''}
            />
            {validationErrors.password && (
              <p className="text-sm text-red-600">{validationErrors.password}</p>
            )}
          </div>

          {!isLoginMode && (
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Potwierdź hasło</Label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                placeholder="Potwierdź hasło"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                className={validationErrors.confirmPassword ? 'border-red-500' : ''}
              />
              {validationErrors.confirmPassword && (
                <p className="text-sm text-red-600">{validationErrors.confirmPassword}</p>
              )}
            </div>
          )}

          <Button 
            type="submit" 
            className="w-full bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600"
            disabled={isLoading}
          >
            {isLoading ? 'Ładowanie...' : isLoginMode ? 'Zaloguj się' : 'Zarejestruj się'}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            {isLoginMode ? 'Nie masz konta?' : 'Masz już konto?'}
            <button
              type="button"
              onClick={toggleMode}
              className="ml-1 text-orange-600 hover:text-orange-700 font-medium"
            >
              {isLoginMode ? 'Zarejestruj się' : 'Zaloguj się'}
            </button>
          </p>
        </div>
      </CardContent>
    </Card>
  );
}; 