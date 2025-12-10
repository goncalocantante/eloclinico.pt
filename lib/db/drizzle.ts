import { drizzle } from "drizzle-orm/postgres-js";
import postgres, { type Sql } from "postgres";
import * as schema from "./schema";
import dotenv from "dotenv";

dotenv.config();

if (!process.env.POSTGRES_URL) {
  throw new Error("POSTGRES_URL environment variable is not set");
}

// Configure connection pooling to prevent "too many clients" error
// In Next.js, we need to limit connections per instance
const maxConnections = 10; // Limit connections per instance
const connectionString = process.env.POSTGRES_URL;

// Singleton pattern to ensure only one client instance is created
// This prevents multiple clients from being created during hot reloading
let globalClient: Sql | undefined;

declare global {
  // eslint-disable-next-line no-var
  var __postgresClient: Sql | undefined;
}

// In development, use global to persist across hot reloads
// In production, use module-level variable
const client =
  process.env.NODE_ENV === "production"
    ? (globalClient ??= postgres(connectionString, {
        max: maxConnections,
        idle_timeout: 20,
        connect_timeout: 10,
      }))
    : (global.__postgresClient ??= postgres(connectionString, {
        max: maxConnections,
        idle_timeout: 20,
        connect_timeout: 10,
      }));

export { client };
export const db = drizzle(client, { schema });
