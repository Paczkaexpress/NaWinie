import React, { useEffect, useState } from 'react';
import AddRecipeForm from './AddRecipeForm';
import { authService } from '../lib/auth';

interface AuthGuardProps {
  children: React.ReactNode;
}

const AuthGuard: React.FC<AuthGuardProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    // Check if user is authenticated using Supabase
    const checkAuth = async () => {
      try {
        const isAuth = await authService.isAuthenticated();
        setIsAuthenticated(isAuth);
      } catch (error) {
        console.error('Auth check failed:', error);
        setIsAuthenticated(false);
      }
    };
    
    checkAuth();
  }, []);

  useEffect(() => {
    if (isAuthenticated === false) {
      // Redirect to auth page with return URL
      const returnUrl = encodeURIComponent('/add-recipe');
      window.location.href = `/auth?returnUrl=${returnUrl}`;
    }
  }, [isAuthenticated]);

  if (isAuthenticated === null) {
    // Loading state
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Return loading state while redirecting
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return <>{children}</>;
};

const AddRecipePage: React.FC = () => {
  return (
    <AuthGuard>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white shadow-lg rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h1 className="text-2xl font-bold text-gray-900">Dodaj nowy przepis</h1>
              <p className="mt-2 text-sm text-gray-600">
                Podziel się swoim ulubionym przepisem z innymi użytkownikami
              </p>
            </div>
            <div className="p-6">
              <AddRecipeForm />
            </div>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
};

export default AddRecipePage; 