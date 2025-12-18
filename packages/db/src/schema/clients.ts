import { pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

export const clients = pgTable('crm_clients', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  crmId: text('crm_id'),
  industry: text('industry'),
  createdAt: timestamp('created_at', { withTimezone: false }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: false }).notNull().defaultNow(),
});
