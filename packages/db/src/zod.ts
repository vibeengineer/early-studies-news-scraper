import { createSchemaFactory } from 'drizzle-zod';

export const { createSelectSchema, createInsertSchema, createUpdateSchema } = createSchemaFactory({
  coerce: { date: true },
});