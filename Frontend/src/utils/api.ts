// ─── Central API utility ──────────────────────────────────────────────────────
// AuthContext stores tokens as: localStorage.setItem('authTokens', JSON.stringify({access, refresh}))
// All fetch calls must use this helper to get the access token.

export const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

/** Returns the JWT access token from localStorage, or null if not logged in */
export function getToken(): string | null {
  try {
    const raw = localStorage.getItem('authTokens');
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed?.access ?? null;
  } catch {
    return null;
  }
}

/** Returns pre-built Authorization headers for fetch calls */
export function authHeaders(extra: Record<string, string> = {}): Record<string, string> {
  const token = getToken();
  return {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...extra,
  };
}

/** Convenience: fetch with auth headers already set */
export async function apiFetch(path: string, options: RequestInit = {}): Promise<Response> {
  return fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      ...authHeaders(options.headers as Record<string, string> ?? {}),
    },
  });
}