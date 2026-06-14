/**
 * Slugify a string for use in URLs.
 *
 * Three-tier fallback chain:
 * 1. Latin-only (a-z, 0-9) — works for English titles
 * 2. Unicode-aware (\\p{L} letters + \\p{M} marks + \\p{N} numbers) — handles Devanagari, Cyrillic, CJK, etc.
 * 3. Timestamp + random suffix — last resort if somehow still empty
 *
 * @param value  The string to slugify
 * @param prefix  Fallback prefix when all characters are stripped (e.g. "article", "set", "subject")
 */
export function slugify(value: string, prefix = "slug"): string {
  let slug = value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 200);

  // Fallback for non-Latin scripts (e.g., Hindi/Devanagari)
  if (!slug) {
    slug = value
      .trim()
      .toLowerCase()
      .replace(/[^\p{L}\p{M}\p{N}\s-]+/gu, "")
      .replace(/[\s]+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 200);
  }

  // Absolute fallback with random suffix to avoid UNIQUE violations
  if (!slug) {
    slug = `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  }

  return slug;
}
