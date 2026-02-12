
import { auth } from "@/lib/auth"; // path to your Better Auth server instance
import { headers } from "next/headers";

import { db } from "@/lib/db/drizzle";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { DEMO_USER_EMAIL } from "@/constants";

export async function getUser() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session || session.user.deletedAt) return null;
  if (!session.user.emailVerified && session.user.email !== DEMO_USER_EMAIL) {
    return null;
  }
  return session.user;
}

export async function getPublicProfile(userId: string) {
  const result = await db
    .select({
      id: users.id,
      name: users.name,
      image: users.image,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (result.length === 0) {
    return null;
  }

  return result[0];
}
