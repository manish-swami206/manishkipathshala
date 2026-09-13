/**
 * Client-side Clerk session-token cache.
 *
 * Multiple React Query hooks call `getToken()` at the same time after the
 * deferred-ready flag flips. Without a cache each call is a separate
 * round-trip to Clerk's frontend API (~200-500 ms each). This module
 * deduplicates concurrent calls and holds the token for a short TTL so
 * back-to-back queries share a single fetch.
 *
 * Usage:
 *   import { getCachedToken } from "@/lib/clerk-token-cache";
 *   const token = await getCachedToken(getToken);
 */

let inflight: Promise<string | null> | null = null;
let cached: { token: string | null; ts: number } | null = null;

const TTL_MS = 4 * 60 * 1000; // 4 minutes — well within Clerk's token lifetime

export async function getCachedToken(
  getToken: () => Promise<string | null>,
): Promise<string | null> {
  const now = Date.now();

  // Return cached token if still fresh
  if (cached && now - cached.ts < TTL_MS) {
    return cached.token;
  }

  // Deduplicate in-flight requests
  if (inflight) return inflight;

  inflight = getToken()
    .then((token) => {
      cached = { token, ts: Date.now() };
      return token;
    })
    .finally(() => {
      inflight = null;
    });

  return inflight;
}

/**
 * Invalidate the cache (e.g. after sign-out or session refresh).
 */
export function invalidateTokenCache(): void {
  cached = null;
}
