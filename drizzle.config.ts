import type { Config } from "drizzle-kit";

export default {
  schema: "./lib/db/schema.ts",
  out: "./lib/db/migrations",
  dialect: "postgresql",
  // strict: true, might want to use this two, search about it
  // verbose: true,
  dbCredentials: {
    url: process.env.POSTGRES_URL!,
  },
} satisfies Config;
