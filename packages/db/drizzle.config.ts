import type { Config } from "drizzle-kit";

export default {
  schema: "./src/schema.ts",
  out: "./migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL || "postgresql://postgres:Weepohlai88!@db.dsjxvwhuvnefduvjbmgk.supabase.co:5432/postgres",
  },
  verbose: true,
  strict: true,
} satisfies Config;
