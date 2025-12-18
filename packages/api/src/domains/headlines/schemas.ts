import { headlinesPublications } from '@early-studies/db/schema';
import { createSelectSchema } from '@early-studies/db/zod';
import { z } from 'zod';

// Base schema from DB (for internal use)
const publicationSelectSchemaBase = createSelectSchema(headlinesPublications);

// OpenAPI-compatible schema (dates as strings for JSON Schema)
export const publicationSelectSchema = publicationSelectSchemaBase.extend({
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});