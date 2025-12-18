import { relations } from "@early-studies/db";
import * as schema from "@early-studies/db/schema";
import { drizzle } from "drizzle-orm/node-postgres";

export function createDb(connectionString: string) {
  return drizzle(connectionString, { schema: { ...schema, relations } });
}

export type Db = ReturnType<typeof createDb>;
