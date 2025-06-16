import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { authService } from '../lib/auth';
import { LogIn, User as UserIcon, LogOut } from 'lucide-react';
import type { User } from '@supabase/supabase-js';

export default function UserAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuthStatus();
    
    // Listen to auth state changes
    const { data: { subscription } } = authService.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null);
        setIsLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const checkAuthStatus = async () => {
    setIsLoading(true);
    try {
      const userData = await authService.getCurrentUser();
      setUser(userData);
    } catch (error) {
      console.error('Auth check failed:', error);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = () => {
    window.location.href = '/auth';
  };

  const handleLogout = async () => {
    await authService.logout();
  };

  if (isLoading) {
    return (
      <div className="h-10 w-24 bg-white/20 rounded animate-pulse" />
    );
  }

  if (user) {
    return (
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 text-white">
          <UserIcon className="h-5 w-5" />
          <span className="text-sm font-MEDIUM">{user.email}</span>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleLogout}
          className="bg-white/10 border-white/20 text-white hover:bg-white/20"
        >
          <LogOut className="h-4 w-4 mr-1" />
          Wyloguj
        </Button>
      </div>
    );
  }

  return (
    <Button
      onClick={handleLogin}
      variant="outline"
      size="sm"
      className="bg-white/10 border-white/20 text-white hover:bg-white/20"
    >
      <LogIn className="h-4 w-4 mr-2" />
      Zaloguj się
    </Button>
  );
} 