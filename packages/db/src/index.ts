// Schema exports
export * from './schema';

// Zod exports
export * from './zod';

// Relations exports
export { relations } from './relations';

// Client exports
export { createDbClient, type DbClient } from './client';

// Type inference helpers
import type { InferInsertModel, InferSelectModel } from 'drizzle-orm';
import type { clients, responses, surveys } from './schema';

// Select types (for reading from DB)
export type Client = InferSelectModel<typeof clients>;
export type Survey = InferSelectModel<typeof surveys>;
export type Response = InferSelectModel<typeof responses>;

// Insert types (for writing to DB)
export type NewClient = InferInsertModel<typeof clients>;
export type NewSurvey = InferInsertModel<typeof surveys>;
export type NewResponse = InferInsertModel<typeof responses>;
