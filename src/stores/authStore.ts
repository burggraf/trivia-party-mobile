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
  resetPassword: (email: string) => Promise<void>;
  initialize: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  session: null,
  loading: false,
  initialized: true, // Start as initialized to prevent blocking

  initialize: async () => {
    try {
      console.log('🚀 Starting auth initialization...');
      
      // Check if we're using placeholder Supabase config
      const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
      const isPlaceholder = supabaseUrl?.includes('placeholder') || !supabaseUrl;

      console.log('🔧 Supabase URL:', supabaseUrl ? 'configured' : 'missing');
      console.log('🔧 Is placeholder:', isPlaceholder);

      if (isPlaceholder) {
        console.warn('⚠️  Supabase not configured - running in demo mode');
        set({ session: null, user: null, initialized: true });
        return;
      }

      console.log('📡 Getting Supabase session...');
      
      // Add timeout to prevent hanging (reduced to 2 seconds for faster failover)
      const sessionPromise = supabase.auth.getSession();
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Supabase session timeout')), 2000);
      });
      
      const result = await Promise.race([sessionPromise, timeoutPromise]) as any;
      const { data: { session } } = result;
      
      console.log('✅ Session retrieved:', session ? 'found' : 'not found');
      set({ session, user: session?.user ?? null, initialized: true });

      // Set up auth state listener with error handling
      try {
        supabase.auth.onAuthStateChange((_event, session) => {
          console.log('🔄 Auth state changed:', _event, session ? 'session exists' : 'no session');
          set({ session, user: session?.user ?? null });
        });
      } catch (listenerError) {
        console.warn('⚠️ Could not set up auth listener:', listenerError);
        // Continue anyway - app can still work without listener
      }
      
      console.log('✅ Auth initialization complete');
    } catch (error) {
      console.error('❌ Error initializing auth:', error);
      console.log('📱 Continuing with offline mode...');
      // Set initialized to true so app continues to work in offline mode
      set({ session: null, user: null, initialized: true });
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

  resetPassword: async (email: string) => {
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

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: 'trivia-party-mobile://reset-password',
      });
      if (error) throw error;
    } catch (error) {
      console.error('Error sending reset password email:', error);
      throw error;
    } finally {
      set({ loading: false });
    }
  },
}));
