import { fetchHeadlines } from '../../services/fetch-headlines';
import type { AuthenticatedAppContext } from '../../../types';
import type { Context } from 'hono';
import { z } from 'zod';

const fetchSchema = z.object({
  startDate: z.string(),
  endDate: z.string(),
  region: z.enum(['US', 'UK']),
  publicationUrls: z.array(z.string()),
  maxQueriesPerPublication: z.number(),
  flattenResults: z.boolean(),
});

export async function fetchHeadlinesHandler(c: Context<AuthenticatedAppContext>) {
  const data = await c.req.json().then(data => fetchSchema.parse(data));
  const result = await fetchHeadlines({ database: c.env.DATABASE_URL, serperApiKey: c.env.SERPER_API_KEY }, data);
  return c.json({ success: true, data: result, error: null }, 200);
}