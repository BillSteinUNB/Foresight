import { create } from 'zustand';
import { Session, User, AuthError } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

interface AuthState {
  session: Session | null;
  user: User | null;
  isLoading: boolean;
  isInitialized: boolean;
  error: string | null;
}

interface AuthActions {
  initialize: () => Promise<void>;
  signUp: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: AuthError | null }>;
  deleteAccount: () => Promise<{ error: Error | null }>;
  clearError: () => void;
  setSession: (session: Session | null) => void;
}

type AuthStore = AuthState & AuthActions;

export const useAuthStore = create<AuthStore>((set, get) => ({
  // State
  session: null,
  user: null,
  isLoading: false,
  isInitialized: false,
  error: null,

  // Actions
  initialize: async () => {
    try {
      set({ isLoading: true });

      // Get current session from secure storage
      const { data: { session }, error } = await supabase.auth.getSession();

      if (error) {
        console.error('Error getting session:', error.message);
        set({ error: error.message });
      }

      set({
        session,
        user: session?.user ?? null,
        isInitialized: true,
        isLoading: false,
      });

      // Listen for auth state changes
      supabase.auth.onAuthStateChange((_event, session) => {
        set({
          session,
          user: session?.user ?? null,
        });
      });
    } catch (err) {
      console.error('Error initializing auth:', err);
      set({
        isInitialized: true,
        isLoading: false,
        error: 'Failed to initialize authentication',
      });
    }
  },

  signUp: async (email: string, password: string) => {
    set({ isLoading: true, error: null });

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      set({ isLoading: false, error: error.message });
      return { error };
    }

    set({
      session: data.session,
      user: data.user,
      isLoading: false,
    });

    return { error: null };
  },

  signIn: async (email: string, password: string) => {
    set({ isLoading: true, error: null });

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      set({ isLoading: false, error: error.message });
      return { error };
    }

    set({
      session: data.session,
      user: data.user,
      isLoading: false,
    });

    return { error: null };
  },

  signOut: async () => {
    set({ isLoading: true, error: null });

    const { error } = await supabase.auth.signOut();

    if (error) {
      set({ isLoading: false, error: error.message });
      return;
    }

    set({
      session: null,
      user: null,
      isLoading: false,
    });
  },

  resetPassword: async (email: string) => {
    set({ isLoading: true, error: null });

    const { error } = await supabase.auth.resetPasswordForEmail(email);

    set({ isLoading: false });

    if (error) {
      set({ error: error.message });
      return { error };
    }

    return { error: null };
  },

  deleteAccount: async () => {
    set({ isLoading: true, error: null });

    const { user } = get();
    if (!user) {
      const error = new Error('No user logged in');
      set({ isLoading: false, error: error.message });
      return { error };
    }

    try {
      // Note: Account deletion requires a server-side function or Edge Function
      // because the client can't delete users directly for security reasons.
      // For now, we'll sign out and the actual deletion should be handled
      // via a Supabase Edge Function or by contacting support.
      
      // TODO: Implement Edge Function for account deletion
      // const { error } = await supabase.functions.invoke('delete-user');
      
      // For now, just sign out
      await supabase.auth.signOut();
      
      set({
        session: null,
        user: null,
        isLoading: false,
      });

      return { error: null };
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to delete account');
      set({ isLoading: false, error: error.message });
      return { error };
    }
  },

  clearError: () => {
    set({ error: null });
  },

  setSession: (session: Session | null) => {
    set({
      session,
      user: session?.user ?? null,
    });
  },
}));

// Selectors
export const selectIsAuthenticated = (state: AuthStore) => !!state.session;
export const selectUser = (state: AuthStore) => state.user;
export const selectIsLoading = (state: AuthStore) => state.isLoading;
export const selectError = (state: AuthStore) => state.error;
export const selectIsInitialized = (state: AuthStore) => state.isInitialized;
