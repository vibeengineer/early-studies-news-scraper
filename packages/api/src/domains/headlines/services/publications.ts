import { headlinesPublications } from "@early-studies/db/schema";
import { and, eq } from "drizzle-orm";
import { createDb } from "@/lib/db";

export function getPublications(
  { database }: { database: string },
  filters?: { category?: string; region?: string }
) {
  const db = createDb(database);

  const conditions: Parameters<typeof and>[0][] = [];
  if (filters?.category) {
    conditions.push(eq(headlinesPublications.category, filters.category));
  }
  if (filters?.region) {
    conditions.push(eq(headlinesPublications.region, filters.region));
  }

  return db.query.headlinesPublications.findMany({
    where: conditions.length ? and(...conditions) : undefined,
  });
}

export async function insertPublication(
  { database }: { database: string },
  data: { name: string; url: string; category?: string; region?: string }
) {
  const db = createDb(database);

  const [result] = await db
    .insert(headlinesPublications)
    .values(data)
    .returning();
  return result;
}

export async function deletePublication(
  { database }: { database: string },
  id: string
) {
  const db = createDb(database);

  const [deleted] = await db
    .delete(headlinesPublications)
    .where(eq(headlinesPublications.id, id))
    .returning();
  return deleted ?? null;
}
