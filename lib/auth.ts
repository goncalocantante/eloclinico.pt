import { betterAuth } from "better-auth";
import { nextCookies } from "better-auth/next-js";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@/lib/db/drizzle";
import { baseUrl } from "@/lib/utils";

export const auth = betterAuth({
  baseURL: baseUrl,
  usePlural: true,
  database: drizzleAdapter(db, {
    provider: "pg",
    usePlural: true,
  }),
  socialProviders: {
    google: {
      prompt: "select_account",
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
      scope: ["https://www.googleapis.com/auth/calendar.events"], // Only this scope will be used
    },
  },
  user: {
    additionalFields: {
      role: {
        type: "string",
        required: true,
        defaultValue: "owner",
      },
      deletedAt: { type: "date", required: false, defaultValue: null },
    },
  },
  advanced: {
    database: {
      generateId: (options) => {
        // Generate UUIDs for all tables including users
        return crypto.randomUUID();
      },
    },
  },
  plugins: [nextCookies()],
});
