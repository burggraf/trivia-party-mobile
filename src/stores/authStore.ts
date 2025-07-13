import { create } from 'zustand';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
  initialized: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (
    email: string,
    password: string,
    displayName: string
  ) => Promise<void>;
  signOut: () => Promise<void>;
  initialize: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  session: null,
  loading: false,
  initialized: false,

  initialize: async () => {
    try {
      // Check if we're using placeholder Supabase config
      const isPlaceholder =
        process.env.EXPO_PUBLIC_SUPABASE_URL?.includes('placeholder') ||
        !process.env.EXPO_PUBLIC_SUPABASE_URL;

      if (isPlaceholder) {
        console.warn('⚠️  Supabase not configured - running in demo mode');
        set({ session: null, user: null, initialized: true });
        return;
      }

      const {
        data: { session },
      } = await supabase.auth.getSession();
      set({ session, user: session?.user ?? null, initialized: true });

      supabase.auth.onAuthStateChange((_event, session) => {
        set({ session, user: session?.user ?? null });
      });
    } catch (error) {
      console.error('Error initializing auth:', error);
      set({ initialized: true });
    }
  },

  signIn: async (email: string, password: string) => {
    try {
      set({ loading: true });

      const isPlaceholder =
        !process.env.EXPO_PUBLIC_SUPABASE_URL ||
        process.env.EXPO_PUBLIC_SUPABASE_URL.includes('placeholder');

      if (isPlaceholder) {
        throw new Error(
          'Supabase not configured. Please set up your Supabase project first.'
        );
      }

      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
    } catch (error) {
      console.error('Error signing in:', error);
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  signUp: async (email: string, password: string, displayName: string) => {
    try {
      set({ loading: true });

      const isPlaceholder =
        !process.env.EXPO_PUBLIC_SUPABASE_URL ||
        process.env.EXPO_PUBLIC_SUPABASE_URL.includes('placeholder');

      if (isPlaceholder) {
        throw new Error(
          'Supabase not configured. Please set up your Supabase project first.'
        );
      }

      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            display_name: displayName,
          },
        },
      });
      if (error) throw error;
    } catch (error) {
      console.error('Error signing up:', error);
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  signOut: async () => {
    try {
      set({ loading: true });
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    } finally {
      set({ loading: false });
    }
  },
}));
