import type { Context } from "hono";
import { z } from "zod";
import type { AuthenticatedAppContext } from "../../../types";
import { fetchHeadlines } from "../../services/fetch-headlines";

const fetchSchema = z.object({
  startDate: z.string(),
  endDate: z.string(),
  region: z.enum(["US", "UK"]),
  publicationUrls: z.array(z.string()),
  maxQueriesPerPublication: z.number(),
  flattenResults: z.boolean(),
});

export async function fetchHeadlinesHandler(
  c: Context<AuthenticatedAppContext>
) {
  const body = await c.req.json().then((body) => fetchSchema.parse(body));
  const result = await fetchHeadlines(
    { serperApiKey: c.env.SERPER_API_KEY },
    body
  );
  return c.json({ success: true, data: result, error: null }, 200);
}
