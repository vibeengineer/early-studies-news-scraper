import { and, eq } from "drizzle-orm";
import { createDb } from "../../lib/db";

export function getPublications(
  { database }: { database: string },
  filters?: { category?: string; region?: string }
) {
  const db = createDb(database);

  const conditions: Parameters<typeof and>[0][] = [];
  if (filters?.category) {
    conditions.push(
      eq(db.schema.headlinesPublications.category, filters.category)
    );
  }
  if (filters?.region) {
    conditions.push(eq(db.schema.headlinesPublications.region, filters.region));
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
    .insert(db.schema.headlinesPublications)
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
    .delete(db.schema.headlinesPublications)
    .where(eq(db.schema.headlinesPublications.id, id))
    .returning();
  return deleted ?? null;
}
