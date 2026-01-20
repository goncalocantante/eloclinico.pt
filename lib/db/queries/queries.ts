
import { auth } from "@/lib/auth"; // path to your Better Auth server instance
import { headers } from "next/headers";

import { db } from "@/lib/db/drizzle";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function getUser(userId?: string) {
  if (userId) {
    const result = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (result.length === 0) {
      return null;
    }

    return result[0];
  }

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session || session.user.deletedAt) return null;
  // TODO - check for verified email
  // if (!session || !session.user.emailVerified ) return null;

  return session.user;
}
