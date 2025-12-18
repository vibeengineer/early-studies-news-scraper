import { drizzle } from "drizzle-orm/node-postgres";
import { relations } from "./relations";
import * as schema from "./schema";

export function createDbClient(connectionString: string) {
  return drizzle(connectionString, { schema: { ...schema, relations } });
}

export type DbClient = ReturnType<typeof createDbClient>;
