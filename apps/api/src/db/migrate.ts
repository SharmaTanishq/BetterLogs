/**
 * Apply pending Drizzle migrations to the database pointed to by DATABASE_URL.
 *
 * Run after `pnpm db:up` brings Postgres online. Also enables the pgvector
 * extension up-front since the generated migration touches `vector` columns.
 */

import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const migrationsFolder = resolve(__dirname, "../../drizzle");

async function main(): Promise<void> {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL not set.");
  }

  const sql = postgres(databaseUrl, { max: 1 });
  await sql`CREATE EXTENSION IF NOT EXISTS vector`;

  const db = drizzle(sql);
  await migrate(db, { migrationsFolder });
  await sql.end();

  console.log(`Migrations applied from ${migrationsFolder}`);
}

main().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
