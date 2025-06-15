import { useState, useEffect } from 'react';

export type AuthState = {
  isAuthenticated: boolean;
  isLoading: boolean;
  userId?: string;
};

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    isAuthenticated: false,
    isLoading: true,
    userId: undefined,
  });

  const checkAuthStatus = () => {
    try {
      const token = localStorage.getItem('access_token');
      const userId = localStorage.getItem('user_id');
      
      if (token && userId) {
        // Basic token validation - check if token exists and is not expired
        try {
          const tokenPayload = JSON.parse(atob(token.split('.')[1]));
          const isExpired = tokenPayload.exp * 1000 < Date.now();
          
          if (!isExpired) {
            setState({
              isAuthenticated: true,
              isLoading: false,
              userId,
            });
            return;
          }
        } catch {
          // If token parsing fails, treat as not authenticated
        }
      }
      
      // Clear invalid tokens
      localStorage.removeItem('access_token');
      localStorage.removeItem('user_id');
      
      setState({
        isAuthenticated: false,
        isLoading: false,
        userId: undefined,
      });
    } catch (error) {
      setState({
        isAuthenticated: false,
        isLoading: false,
        userId: undefined,
      });
    }
  };

  const login = (token: string, userId: string) => {
    localStorage.setItem('access_token', token);
    localStorage.setItem('user_id', userId);
    setState({
      isAuthenticated: true,
      isLoading: false,
      userId,
    });
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user_id');
    setState({
      isAuthenticated: false,
      isLoading: false,
      userId: undefined,
    });
  };

  useEffect(() => {
    checkAuthStatus();
    
    // Listen for storage changes (e.g., logout in another tab)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'access_token' || e.key === 'user_id') {
        checkAuthStatus();
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  return { ...state, login, logout, checkAuthStatus };
} 