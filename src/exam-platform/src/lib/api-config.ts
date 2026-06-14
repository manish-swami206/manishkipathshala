/**
 * Central API configuration for frontend.
 * Uses NEXT_PUBLIC_API_URL environment variable (set to http://localhost:4000 by default).
 */
export const API_BASE_URL: string | null =
  process.env.NEXT_PUBLIC_API_URL || null;

// NOT USED ANYMORE
// export const NEXT_API_BASE_URL = API_BASE_URL;
