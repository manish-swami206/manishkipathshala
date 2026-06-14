import { useAuth } from "@clerk/nextjs";
import { useCallback } from "react";
import { apiFetch, ApiError } from "@/lib/api/client";

type FetchOptions = Parameters<typeof apiFetch>[1];

/**
 * Hook that returns an adminFetch function which automatically
 * injects the Clerk Bearer token into every API call.
 */
export function useAdminFetch() {
  const { getToken } = useAuth();

  const adminFetch = useCallback(
    async <T>(path: string, options?: Omit<FetchOptions, "token">): Promise<T> => {
      const token = await getToken();
      if (!token) throw new ApiError(401, "Not authenticated");
      return apiFetch<T>(path, { ...options, token });
    },
    [getToken],
  );

  return adminFetch;
}
