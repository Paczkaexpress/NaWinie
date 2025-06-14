import { supabase } from './supabaseClient';
import type { User, Session, AuthError } from '@supabase/supabase-js';

interface LoginRequest {
  email: string;
  password: string;
}

interface RegisterRequest {
  email: string;
  password: string;
  confirm_password: string;
}

interface AuthResponse {
  user: User | null;
  session: Session | null;
}

class AuthService {
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: credentials.email,
      password: credentials.password,
    });

    if (error) {
      throw new Error(error.message || 'Login failed');
    }

    return {
      user: data.user,
      session: data.session,
    };
  }

  async register(userData: RegisterRequest): Promise<AuthResponse> {
    if (userData.password !== userData.confirm_password) {
      throw new Error('Passwords do not match');
    }

    const { data, error } = await supabase.auth.signUp({
      email: userData.email,
      password: userData.password,
    });

    if (error) {
      throw new Error(error.message || 'Registration failed');
    }

    return {
      user: data.user,
      session: data.session,
    };
  }

  async getCurrentUser(): Promise<User | null> {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  }

  async logout(): Promise<void> {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Logout error:', error);
    }
    // Redirect to home page
    window.location.href = '/';
  }

  async getSession(): Promise<Session | null> {
    const { data: { session } } = await supabase.auth.getSession();
    return session;
  }

  getUser(): User | null {
    // This is a synchronous method that gets user from the current session
    // For async operations, use getCurrentUser()
    return null; // Will be handled by session state
  }

  async isAuthenticated(): Promise<boolean> {
    const session = await this.getSession();
    return !!session?.user;
  }

  // Listen to auth state changes
  onAuthStateChange(callback: (event: string, session: Session | null) => void) {
    return supabase.auth.onAuthStateChange(callback);
  }
}

export const authService = new AuthService();
export type { LoginRequest, RegisterRequest, AuthResponse }; 