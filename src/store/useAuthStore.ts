import { create } from "zustand";
import { supabase, isSupabaseConfigured } from "../lib/supabase";

interface UserAccess {
  user_id: string;
  email: string;
  service_end_time: string | null;
  is_active: boolean;
}

interface AuthState {
  user: any | null;
  userAccess: UserAccess | null;
  isAdmin: boolean;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  checkUser: () => Promise<void>;
}

const ADMIN_EMAILS = ["reelywood@gmail.com", "rohan00as@gmail.com"];

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  userAccess: null,
  isAdmin: false,
  loading: true,

  checkUser: async () => {
    if (!isSupabaseConfigured) {
      // Mock user for Preview
      set({
        user: {
          id: "mock",
          email: "owner@billkaro.app",
          user_metadata: { full_name: "Owner" },
        },
        userAccess: {
          user_id: "mock",
          email: "owner@billkaro.app",
          service_end_time: null,
          is_active: true,
        },
        isAdmin: false,
        loading: false,
      });
      return;
    }

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const currentUser = session?.user || null;

      if (currentUser) {
        const isAdmin = currentUser.email
          ? ADMIN_EMAILS.includes(currentUser.email)
          : false;

        let { data: accessList, error: accessError } = await supabase
          .from("user_access")
          .select("*")
          .eq("user_id", currentUser.id)
          .limit(1);
          
        let access = accessList && accessList.length > 0 ? accessList[0] : null;

        if (!access && !accessError) {
          const { data: newAccess } = await supabase
            .from("user_access")
            .insert({
              user_id: currentUser.id,
              email: currentUser.email,
            })
            .select()
            .maybeSingle();
          access = newAccess;
        }

        set({ user: currentUser, userAccess: access, isAdmin, loading: false });
      } else {
        set({ user: null, userAccess: null, isAdmin: false, loading: false });
      }

      supabase.auth.onAuthStateChange(async (_event, session) => {
        const user = session?.user || null;
        if (user) {
          const isAdmin = user.email
            ? ADMIN_EMAILS.includes(user.email)
            : false;
          let { data: accessList, error: accessError } = await supabase
            .from("user_access")
            .select("*")
            .eq("user_id", user.id)
            .limit(1);
            
          let access = accessList && accessList.length > 0 ? accessList[0] : null;

          if (!access && !accessError) {
            const { data: newAccess } = await supabase
              .from("user_access")
              .insert({
                user_id: user.id,
                email: user.email,
              })
              .select()
              .maybeSingle();
            access = newAccess;
          }
          set({ user, userAccess: access, isAdmin });
        } else {
          set({ user: null, userAccess: null, isAdmin: false });
        }
      });
    } catch (e) {
      console.error(e);
      set({ loading: false });
    }
  },

  signInWithGoogle: async () => {
    if (!isSupabaseConfigured) {
      alert(
        "Missing Configuration: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are not set in your environment variables. Falling back to Mock Login for preview purposes.",
      );
      // Mock Sign in
      set({
        user: {
          id: "mock",
          email: "owner@billkaro.app",
          user_metadata: { full_name: "Owner" },
        },
        userAccess: {
          user_id: "mock",
          email: "owner@billkaro.app",
          service_end_time: null,
          is_active: true,
        },
        isAdmin: false,
      });
      return;
    }
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: window.location.origin,
        },
      });
      if (error) {
        console.error("Supabase Auth Error:", error);
        alert(
          `Google Login Error: ${error.message}\n\nTo fix this:\n1. Go to your Supabase Dashboard -> Authentication -> Providers and enable Google.\n2. Add your Google Client ID and Secret.\n3. Make sure to add "${window.location.origin}" to your Site URL and Redirect URLs in Supabase Authentication Settings.`,
        );
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
    set({ user: null, userAccess: null, isAdmin: false });
  },
}));
