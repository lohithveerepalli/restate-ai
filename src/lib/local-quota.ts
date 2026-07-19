/** Client-side free generation quota when Supabase is unavailable. */

const KEY = "restate-local-quota-v1";
const FREE_LIMIT = 3;

export interface LocalQuota {
  used: number;
  remaining: number;
  limit: number;
}

function read(): { used: number } {
  if (typeof window === "undefined") return { used: 0 };
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { used: 0 };
    const parsed = JSON.parse(raw) as { used?: number };
    return { used: Math.max(0, parsed.used ?? 0) };
  } catch {
    return { used: 0 };
  }
}

function write(used: number) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify({ used }));
}

export function getLocalQuota(): LocalQuota {
  const { used } = read();
  const remaining = Math.max(0, FREE_LIMIT - used);
  return { used, remaining, limit: FREE_LIMIT };
}

export function canGenerateLocally(): boolean {
  return getLocalQuota().remaining > 0;
}

export function consumeLocalGeneration(): LocalQuota {
  const { used } = read();
  if (used >= FREE_LIMIT) {
    return getLocalQuota();
  }
  write(used + 1);
  return getLocalQuota();
}

export function grantLocalGeneration(n = 1): LocalQuota {
  const { used } = read();
  write(Math.max(0, used - n));
  return getLocalQuota();
}

export function resetLocalQuota() {
  write(0);
}
