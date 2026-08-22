import { db } from "../lib/db";
import { eq, desc } from "drizzle-orm";
import { currentAffairsTable } from "@workspace/db";
import { slugify } from "../utils/slugify";

const slugifyTitle = (value: string) => slugify(value, "article");

export const getCurrentAffairs = async () => {
  return await db
    .select()
    .from(currentAffairsTable)
    .orderBy(desc(currentAffairsTable.publishedAt));
};

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isValidUuid(value: string): boolean {
  return UUID_PATTERN.test(value);
}

export const getCurrentAffairById = async (slug: string) => {
  const normalized = slugifyTitle(slug);

  // 1. Try matching by slug column
  const [article] = await db
    .select()
    .from(currentAffairsTable)
    .where(eq(currentAffairsTable.slug, slug))
    .limit(1);

  if (article) return article;

  // 2. Try matching by UUID (only if the value looks like a valid UUID)
  if (isValidUuid(slug)) {
    const [byId] = await db
      .select()
      .from(currentAffairsTable)
      .where(eq(currentAffairsTable.id, slug))
      .limit(1);

    if (byId) return byId;
  }

  // 3. Fall back to title-based slug comparison.
  // Bounded to the 100 most recent articles so a legacy slug mismatch can
  // never trigger a full-table scan + full payload transfer (issue A1).
  const candidates = await db
    .select()
    .from(currentAffairsTable)
    .orderBy(desc(currentAffairsTable.publishedAt))
    .limit(100);

  return candidates.find((a) => slugifyTitle(a.title) === normalized);
};


