import { useState, useEffect } from 'react';
import { authService } from '../lib/auth';
import type { User } from '@supabase/supabase-js';

export type AuthState = {
  isAuthenticated: boolean;
  isLoading: boolean;
  userId?: string;
  user?: User | null;
};

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    isAuthenticated: false,
    isLoading: true,
    userId: undefined,
    user: null,
  });

  const checkAuthStatus = async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true }));
      
      const user = await authService.getCurrentUser();
      const session = await authService.getSession();
      
      if (user && session) {
        setState({
          isAuthenticated: true,
          isLoading: false,
          userId: user.id,
          user,
        });
      } else {
        setState({
          isAuthenticated: false,
          isLoading: false,
          userId: undefined,
          user: null,
        });
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      setState({
        isAuthenticated: false,
        isLoading: false,
        userId: undefined,
        user: null,
      });
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const { user, session } = await authService.login({ email, password });
      if (user && session) {
        setState({
          isAuthenticated: true,
          isLoading: false,
          userId: user.id,
          user,
        });
      }
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
      setState({
        isAuthenticated: false,
        isLoading: false,
        userId: undefined,
        user: null,
      });
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  useEffect(() => {
    checkAuthStatus();
    
    // Listen to Supabase auth state changes
    const { data: { subscription } } = authService.onAuthStateChange(
      (event, session) => {
        if (session?.user) {
          setState({
            isAuthenticated: true,
            isLoading: false,
            userId: session.user.id,
            user: session.user,
          });
        } else {
          setState({
            isAuthenticated: false,
            isLoading: false,
            userId: undefined,
            user: null,
          });
        }
      }
    );
    
    return () => subscription.unsubscribe();
  }, []);

  return { ...state, login, logout, checkAuthStatus };
} 