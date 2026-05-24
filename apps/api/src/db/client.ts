import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema.js";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error("DATABASE_URL not set. Did you forget to run with --env-file=.env?");
}

const queryClient = postgres(databaseUrl, {
  max: 10,
  idle_timeout: 30,
  prepare: false,
});

export const db = drizzle(queryClient, { schema });
export type Db = typeof db;
export { schema };
