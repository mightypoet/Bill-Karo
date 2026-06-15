import { create } from 'zustand';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

interface AuthState {
  user: any | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  checkUser: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: true,

  checkUser: async () => {
    if (!isSupabaseConfigured) {
      // Mock user for Preview
      set({ user: { id: 'mock', email: 'owner@billkaro.app', user_metadata: { full_name: 'Owner' } }, loading: false });
      return;
    }
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      set({ user: session?.user || null, loading: false });

      supabase.auth.onAuthStateChange((_event, session) => {
        set({ user: session?.user || null });
      });
    } catch (e) {
      console.error(e);
      set({ loading: false });
    }
  },

  signInWithGoogle: async () => {
    if (!isSupabaseConfigured) {
      // Mock Sign in 
      set({ user: { id: 'mock', email: 'owner@billkaro.app', user_metadata: { full_name: 'Owner' } } });
      return;
    }
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
      }
    });
  },

  signOut: async () => {
    if (isSupabaseConfigured) {
      await supabase.auth.signOut();
    }
    set({ user: null });
  }
}));
