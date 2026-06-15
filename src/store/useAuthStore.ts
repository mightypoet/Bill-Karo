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
      alert("Missing Configuration: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are not set in your environment variables. Falling back to Mock Login for preview purposes.");
      // Mock Sign in 
      set({ user: { id: 'mock', email: 'owner@billkaro.app', user_metadata: { full_name: 'Owner' } } });
      return;
    }
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
        }
      });
      if (error) {
        console.error("Supabase Auth Error:", error);
        alert(`Google Login Error: ${error.message}\n\nTo fix this:\n1. Go to your Supabase Dashboard -> Authentication -> Providers and enable Google.\n2. Add your Google Client ID and Secret.\n3. Make sure to add "${window.location.origin}" to your Site URL and Redirect URLs in Supabase Authentication Settings.`);
      }
    } catch (e: any) {
      console.error(e);
      alert(`Error during login: ${e.message}`);
    }
  },

  signOut: async () => {
    if (isSupabaseConfigured) {
      await supabase.auth.signOut();
    }
    set({ user: null });
  }
}));
