import type { Context } from "hono";
import { z } from "zod";
import type { AuthenticatedAppContext } from "../../../types";
import { insertPublication } from "../../services/publications";

const createSchema = z.object({
  name: z.string(),
  url: z.string(),
  category: z.string().optional(),
  region: z.string().optional(),
});

export async function createPublicationHandler(
  c: Context<AuthenticatedAppContext>
) {
  const body = await c.req.json().then((body) => createSchema.parse(body));
  const publication = await insertPublication(
    { database: c.env.DATABASE_URL },
    body
  );
  return c.json({ success: true, data: { publication }, error: null }, 201);
}
