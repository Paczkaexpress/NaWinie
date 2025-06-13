import React, { useState, useEffect } from 'react';
import { AuthForm } from './AuthForm';
import { authService, type LoginRequest, type RegisterRequest } from '../lib/auth';

interface AuthFormData {
  email: string;
  password: string;
  confirmPassword?: string;
}

export default function AuthView() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    // Check if user is already authenticated
    const checkAuth = async () => {
      if (await authService.isAuthenticated()) {
        // Redirect to home page
        window.location.href = '/';
      }
    };
    checkAuth();
  }, []);

  const handleAuth = async (formData: AuthFormData) => {
    setIsLoading(true);
    setError('');

    try {
      if (formData.confirmPassword !== undefined) {
        // Register mode
        const registerData: RegisterRequest = {
          email: formData.email,
          password: formData.password,
          confirm_password: formData.confirmPassword
        };
        const result = await authService.register(registerData);
        
        // Show success message for registration
        if (result.user && !result.session) {
          setError('Registration successful! Please check your email to confirm your account.');
          return;
        }
      } else {
        // Login mode
        const loginData: LoginRequest = {
          email: formData.email,
          password: formData.password
        };
        await authService.login(loginData);
      }

      // Redirect to home page on success
      window.location.href = '/';
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-[60vh]">
      <AuthForm 
        onSubmit={handleAuth}
        isLoading={isLoading}
        error={error}
      />
    </div>
  );
} 