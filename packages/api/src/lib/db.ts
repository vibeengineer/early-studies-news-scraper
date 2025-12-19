import { relations } from "@early-studies/db/relations";
import {
  clients,
  headlinesPublications,
  responses,
  surveys,
} from "@early-studies/db/schema";
import { drizzle } from "drizzle-orm/node-postgres";

export function createDb(connectionString: string) {
  return drizzle(connectionString, {
    schema: {
      headlinesPublications,
      surveys,
      responses,
      clients,
      relations,
    },
  });
}

export type Db = ReturnType<typeof createDb>;
