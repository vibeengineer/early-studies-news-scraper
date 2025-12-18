import { defineRelations } from "drizzle-orm";
import { clients, responses, surveys } from "./schema";

export const relations = defineRelations(
  {
    clients,
    surveys,
    responses,
  },
  (r) => ({
    clients: {
      surveys: r.many.surveys(),
    },
    surveys: {
      client: r.one.clients({
        from: r.surveys.clientId,
        to: r.clients.id,
      }),
      responses: r.many.responses(),
    },
    responses: {
      survey: r.one.surveys({
        from: r.responses.surveyId,
        to: r.surveys.id,
      }),
    },
  })
);
