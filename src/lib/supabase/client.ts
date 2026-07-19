import { createBrowserClient } from "@supabase/ssr";
import {
  getSupabaseAnonKey,
  getSupabaseUrlClient,
} from "@/lib/supabase/config";

export function createClient() {
  const url = getSupabaseUrlClient();
  const key = getSupabaseAnonKey();

  if (!url || !key) {
    return null;
  }

  return createBrowserClient(url, key);
}

export function isSupabaseConfigured() {
  // Client-side: env URL or wizard URL + publishable key
  if (typeof window !== "undefined") {
    return Boolean(getSupabaseUrlClient() && getSupabaseAnonKey());
  }
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && getSupabaseAnonKey()
  );
}
