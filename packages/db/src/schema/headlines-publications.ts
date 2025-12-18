import { index, pgTable, text, timestamp, uniqueIndex, varchar } from 'drizzle-orm/pg-core';
import { nanoid } from 'nanoid';

export const publicationCategories = [
  'broadcaster',
  'broadsheet',
  'tabloid',
  'digital',
  'financial',
  'magazinePeriodical',
  'newsAgency',
  'other',
] as const;

export type PublicationCategory = (typeof publicationCategories)[number];

export const headlinesPublications = pgTable(
  'headlines_publications',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => nanoid(8)),
    name: varchar('name', { length: 255 }).notNull(),
    url: varchar('url', { length: 500 }).notNull(),
    category: varchar('category', { length: 50 }).$type<PublicationCategory>(),
    region: varchar('region', { length: 100 }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    urlIdx: uniqueIndex('headlines_publications_url_idx').on(table.url),
    categoryIdx: index('headlines_publications_category_idx').on(table.category),
    regionIdx: index('headlines_publications_region_idx').on(table.region),
  })
);
