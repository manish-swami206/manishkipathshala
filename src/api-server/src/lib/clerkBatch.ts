import { clerkClient } from "@clerk/express";

/**
 * Batch-fetch Clerk users by their IDs.
 * Uses `getUserList({ userId: [...] })` which accepts up to 100 IDs per call,
 * eliminating the N+1 pattern of calling `getUser()` per row.
 *
 * Returns a Map of userId → { firstName, lastName, email } for O(1) lookup.
 * Missing users are silently omitted (the caller falls back to defaults).
 */
export async function batchGetClerkUsers(
  userIds: string[],
): Promise<Map<string, { firstName: string; lastName: string; email: string }>> {
  const result = new Map<string, { firstName: string; lastName: string; email: string }>();
  if (userIds.length === 0) return result;

  // Clerk getUserList accepts up to 100 userIds per call — chunk if needed
  const CHUNK = 100;
  const chunks: string[][] = [];
  for (let i = 0; i < userIds.length; i += CHUNK) {
    chunks.push(userIds.slice(i, i + CHUNK));
  }

  const responses = await Promise.all(
    chunks.map((chunk) =>
      clerkClient.users
        .getUserList({ userId: chunk })
        .catch(() => ({ data: [] })),
    ),
  );

  for (const resp of responses) {
    for (const user of resp.data) {
      result.set(user.id, {
        firstName: user.firstName ?? "",
        lastName: user.lastName ?? "",
        email: user.emailAddresses?.[0]?.emailAddress ?? "",
      });
    }
  }

  return result;
}
