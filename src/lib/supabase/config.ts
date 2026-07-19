/**
 * Resolve Supabase URL + key.
 * URL can come from env OR client-side setup wizard (localStorage).
 */

export const SUPABASE_URL_STORAGE_KEY = "restate-supabase-url";

export function getSupabaseAnonKey(): string | null {
  return (
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    null
  );
}

export function getSupabaseUrlFromEnv(): string | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  return url || null;
}

export function getSupabaseUrlClient(): string | null {
  const fromEnv = getSupabaseUrlFromEnv();
  if (fromEnv) return fromEnv;
  if (typeof window === "undefined") return null;
  try {
    const stored = localStorage.getItem(SUPABASE_URL_STORAGE_KEY)?.trim();
    if (stored && /^https:\/\/[a-z0-9-]+\.supabase\.co\/?$/i.test(stored)) {
      return stored.replace(/\/$/, "");
    }
  } catch {
    /* ignore */
  }
  return null;
}

export function setSupabaseUrlClient(url: string) {
  const cleaned = url.trim().replace(/\/$/, "");
  localStorage.setItem(SUPABASE_URL_STORAGE_KEY, cleaned);
}

export function isSupabaseFullyConfiguredClient(): boolean {
  return Boolean(getSupabaseUrlClient() && getSupabaseAnonKey());
}
