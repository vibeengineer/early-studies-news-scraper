import type { Context } from "hono";
import { z } from "zod";
import type { AuthenticatedAppContext } from "@/types";
import { getPublications } from "../../../services/publications";

const querySchema = z.object({
  category: z.string().optional(),
  region: z.string().optional(),
});

export async function getPublicationsHandler(
  c: Context<AuthenticatedAppContext>
) {
  const filters = await c.req.json().then((data) => querySchema.parse(data));
  const publications = await getPublications(
    { database: c.env.DATABASE_URL },
    filters
  );
  return c.json({ success: true, data: { publications }, error: null }, 200);
}
