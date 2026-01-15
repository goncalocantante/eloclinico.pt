
import { auth } from "@/lib/auth"; // path to your Better Auth server instance
import { headers } from "next/headers";

export async function getUser() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session || session.user.deletedAt) return null;
  // TODO - check for verified email
  // if (!session || !session.user.emailVerified ) return null;

  return session.user;
}
