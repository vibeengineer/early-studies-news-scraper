import { insertPublication } from '../../services/publications';
import type { AuthenticatedAppContext } from '../../../types';
import type { Context } from 'hono';
import { z } from 'zod';

const createSchema = z.object({
  name: z.string(),
  url: z.string(),
  category: z.string().optional(),
  region: z.string().optional(),
});

export async function createPublicationHandler(c: Context<AuthenticatedAppContext>) {
  const data = await c.req.json().then(data => createSchema.parse(data));
  const publication = await insertPublication({ database: c.env.DATABASE_URL }, data);
  return c.json({ success: true, data: { publication }, error: null }, 201);
}