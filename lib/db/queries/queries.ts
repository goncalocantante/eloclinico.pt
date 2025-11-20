import { desc, eq } from "drizzle-orm";
import { db } from "../drizzle";
import {
  activityLogs,
  clinicMembers,
  clinics,
  users,
  UserContext,
  Roles,
} from "../schema";
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

export async function getUserWithContext(): Promise<UserContext | null> {
  const user = await getUser();
  if (!user) {
    return null;
  }

  const teamMembers = await db
    .select()
    .from(clinicMembers)
    .where(eq(clinicMembers.userId, user.id))
    .limit(1);

  let effectiveRole = "owner" as Roles; // default to be overriden

  if (teamMembers[0]) {
    effectiveRole = teamMembers[0].role as Roles;
  } else {
    // todo - implement the correct logic when "patient" role is introduced
    effectiveRole = "patient";
  }
  return {
    ...user,
    clinicId: teamMembers[0]?.clinicId ?? null,
    effectiveRole,
  };
}

export async function getClinicByStripeCustomerId(customerId: string) {
  const result = await db
    .select()
    .from(clinics)
    .where(eq(clinics.stripeCustomerId, customerId))
    .limit(1);

  return result.length > 0 ? result[0] : null;
}

export async function updateClinicSubscription(
  clinicId: number,
  subscriptionData: {
    stripeSubscriptionId: string | null;
    stripeProductId: string | null;
    planName: string | null;
    subscriptionStatus: string;
  }
) {
  await db
    .update(clinics)
    .set({
      ...subscriptionData,
      updatedAt: new Date(),
    })
    .where(eq(clinics.id, clinicId));
}

export async function getUserWithClinic(userId: string) {
  const result = await db
    .select({
      user: users,
      clinicId: clinicMembers.clinicId,
    })
    .from(users)
    .leftJoin(clinicMembers, eq(users.id, clinicMembers.userId))
    .where(eq(users.id, userId))
    .limit(1);

  return result[0];
}

export async function getActivityLogs() {
  const user = await getUser();

  if (!user) {
    throw new Error("User not authenticated");
  }

  return await db
    .select({
      id: activityLogs.id,
      action: activityLogs.action,
      timestamp: activityLogs.timestamp,
      ipAddress: activityLogs.ipAddress,
      userName: users.name,
    })
    .from(activityLogs)
    .leftJoin(users, eq(activityLogs.userId, users.id))
    .where(eq(activityLogs.userId, user.id))
    .orderBy(desc(activityLogs.timestamp))
    .limit(10);
}

export async function getClinicForUser() {
  const user = await getUser();
  if (!user) {
    throw new Error("User not authenticated");
  }

  const result = await db.query.clinicMembers.findFirst({
    where: eq(clinicMembers.userId, user.id),
    with: {
      clinic: {
        with: {
          clinicMembers: {
            with: {
              user: {
                columns: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
          },
        },
      },
    },
  });

  return result?.clinic || null;
}
