/**
 * Retry a webhook handler with exponential backoff.
 *
 * Used for fire-and-forget DB writes after responding to Clerk.
 * If all retries fail, the error is logged with full context for manual investigation.
 *
 * Backoff: 1s → 2s → 4s (3 attempts, ~7s total)
 */

interface RetryOptions {
  /** Max number of attempts (default: 3) */
  maxAttempts?: number;
  /** Base delay in ms — doubles each attempt (default: 1000) */
  baseDelayMs?: number;
  /** Label for log messages */
  label?: string;
}

export async function withWebhookRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {},
): Promise<T | null> {
  const { maxAttempts = 3, baseDelayMs = 1000, label = "webhook" } = options;
  let lastError: unknown;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;

      if (attempt < maxAttempts) {
        const delay = baseDelayMs * Math.pow(2, attempt - 1);
        console.warn(
          `[${label}] Attempt ${attempt}/${maxAttempts} failed, retrying in ${delay}ms...`,
          err instanceof Error ? err.message : err,
        );
        await sleep(delay);
      }
    }
  }

  // All retries exhausted — log for manual investigation
  console.error(
    `[${label}] All ${maxAttempts} attempts failed. Manual retry needed.`,
    lastError instanceof Error ? lastError.message : lastError,
  );

  return null;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
