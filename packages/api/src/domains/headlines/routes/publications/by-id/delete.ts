import type { Context } from "hono";
import { z } from "zod";
import type { AuthenticatedAppContext } from "../../../../types";
import { deletePublication } from "../../../services/publications";

const deleteSchema = z.object({
  id: z.string(),
});

export async function deletePublicationHandler(
  c: Context<AuthenticatedAppContext>
) {
  const { id } = await c.req.json().then((data) => deleteSchema.parse(data));
  const publication = await deletePublication(
    { database: c.env.DATABASE_URL },
    id
  );
  if (!publication) {
    return c.json(
      {
        success: false,
        data: null,
        error: { message: "Publication not found", code: "NOT_FOUND" },
      },
      404
    );
  }
  return c.json({ success: true, data: { publication }, error: null }, 200);
}
