"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { User, Session } from "@supabase/supabase-js";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { useStudioStore } from "@/stores/studio-store";
import type { Profile } from "@/types";

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  configured: boolean;
  signInWithEmail: (email: string, password: string) => Promise<string | null>;
  signUpWithEmail: (
    email: string,
    password: string,
    fullName?: string
  ) => Promise<string | null>;
  signInWithOAuth: (provider: "google" | "apple") => Promise<string | null>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [configured, setConfigured] = useState(false);

  const setStoreProfile = useStudioStore((s) => s.setProfile);
  const setAuthenticated = useStudioStore((s) => s.setAuthenticated);

  useEffect(() => {
    setConfigured(isSupabaseConfigured());
  }, []);

  const loadProfile = useCallback(async (userId: string) => {
    const supabase = createClient();
    if (!supabase) return null;
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle();
    if (error) {
      console.error("profile load", error);
      return null;
    }
    return data as Profile | null;
  }, []);

  const refreshProfile = useCallback(async () => {
    if (!user) return;
    const p = await loadProfile(user.id);
    setProfile(p);
    setStoreProfile(p);
  }, [user, loadProfile, setStoreProfile]);

  useEffect(() => {
    if (!configured) {
      setLoading(false);
      return;
    }

    const supabase = createClient();
    if (!supabase) {
      setLoading(false);
      return;
    }

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setUser(data.session?.user ?? null);
      setAuthenticated(!!data.session?.user);
      if (data.session?.user) {
        loadProfile(data.session.user.id).then((p) => {
          setProfile(p);
          setStoreProfile(p);
          setLoading(false);
        });
      } else {
        setLoading(false);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, nextSession) => {
      setSession(nextSession);
      setUser(nextSession?.user ?? null);
      setAuthenticated(!!nextSession?.user);
      if (nextSession?.user) {
        const p = await loadProfile(nextSession.user.id);
        setProfile(p);
        setStoreProfile(p);
      } else {
        setProfile(null);
        setStoreProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, [configured, loadProfile, setAuthenticated, setStoreProfile]);

  const signInWithEmail = useCallback(
    async (email: string, password: string) => {
      const supabase = createClient();
      if (!supabase) return "Supabase is not configured";
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      return error?.message ?? null;
    },
    []
  );

  const signUpWithEmail = useCallback(
    async (email: string, password: string, fullName?: string) => {
      const supabase = createClient();
      if (!supabase) return "Supabase is not configured";
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      return error?.message ?? null;
    },
    []
  );

  const signInWithOAuth = useCallback(
    async (provider: "google" | "apple") => {
      const supabase = createClient();
      if (!supabase) return "Supabase is not configured";
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=/studio`,
        },
      });
      return error?.message ?? null;
    },
    []
  );

  const signOut = useCallback(async () => {
    const supabase = createClient();
    if (supabase) await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
    setStoreProfile(null);
    setAuthenticated(false);
  }, [setAuthenticated, setStoreProfile]);

  const value = useMemo(
    () => ({
      user,
      session,
      profile,
      loading,
      configured,
      signInWithEmail,
      signUpWithEmail,
      signInWithOAuth,
      signOut,
      refreshProfile,
    }),
    [
      user,
      session,
      profile,
      loading,
      configured,
      signInWithEmail,
      signUpWithEmail,
      signInWithOAuth,
      signOut,
      refreshProfile,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
