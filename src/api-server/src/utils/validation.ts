import type { z } from "zod";

/**
 * Formats Zod validation issues into a human-readable string.
 * Example: "title — Title is required; email — Expected a valid email address"
 */
export function formatZodIssues(issues: z.ZodIssue[]): string {
  return issues
    .map((i) => {
      const field = i.path.length > 0 ? i.path.join(".") : "value";
      return `${field} — ${i.message}`;
    })
    .join("; ");
}
