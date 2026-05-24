import { defineConfig } from "drizzle-kit";

// DATABASE_URL is only needed for commands that talk to the DB (migrate,
// push, studio). `drizzle-kit generate` works from the schema alone, so we
// only fail when a URL is actually missing at the point a command requires it.
const databaseUrl = process.env.DATABASE_URL ?? "";

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: { url: databaseUrl },
  strict: true,
  verbose: true,
});
