"use server";

import { auth } from "@/lib/auth";
import { z } from "zod";
import { and, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db/drizzle";
import {
  User,
  users,
  clinics,
  clinicMembers,
  activityLogs,
  type NewUser,
  type NewClinic,
  type NewClinicMember,
  type NewActivityLog,
  ActivityType,
  invitations_old,
} from "@/lib/db/schema";
import { comparePasswords } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { cookies, headers } from "next/headers";
import { createCheckoutSession } from "@/lib/payments/stripe";
import { getUser, getUserWithClinic } from "@/lib/db/queries/queries";
import {
  validatedAction,
  validatedActionWithUser,
} from "@/lib/auth/middleware";
import { changePasswordErrorMap } from "@/lib/auth/error";

async function logActivity(
  clinicId: number | null | undefined,
  userId: string | number,
  type: ActivityType,
  ipAddress?: string
) {
  if (clinicId === null || clinicId === undefined) {
    return;
  }
  const normalizedUserId =
    typeof userId === "number" ? userId.toString() : userId;
  const newActivity: NewActivityLog = {
    clinicId,
    userId: normalizedUserId,
    action: type,
    ipAddress: ipAddress || "",
  };
  await db.insert(activityLogs).values(newActivity);
}

const signInSchema = z.object({
  email: z.string().email().min(3).max(255),
  password: z.string().min(8).max(100),
});

export const signIn = validatedAction(signInSchema, async (data, formData) => {
  const { email, password } = data;

  await auth.api.signInEmail({
    body: {
      email,
      password,
      rememberMe: true,
      // callbackURL: "https://example.com/callback",
    },
    // This endpoint requires session cookies.
    headers: await headers(),
  });

  const userWithClinic = await db
    .select({
      user: users,
      clinic: clinics,
    })
    .from(users)
    .leftJoin(clinicMembers, eq(users.id, clinicMembers.userId))
    .leftJoin(clinics, eq(clinicMembers.clinicId, clinics.id))
    .where(eq(users.email, email))
    .limit(1);

  if (userWithClinic.length === 0) {
    return {
      error: "Invalid email or password. Please try again.",
      email,
      password,
    };
  }

  const { user: foundUser, clinic: foundClinic } = userWithClinic[0];

  await logActivity(foundClinic?.id, foundUser.id, ActivityType.SIGN_IN);

  const redirectTo = formData.get("redirect") as string | null;
  if (redirectTo === "checkout") {
    const priceId = formData.get("priceId") as string;
    return createCheckoutSession({ clinic: foundClinic, priceId });
  }
  redirect("/dashboard");
});

const signUpSchema = z.object({
  name: z.string().min(1, "Name is required").max(100).optional(), // required
  email: z.string().email().min(3).max(255), // required
  password: z.string().min(8).max(100), // required
  inviteId: z.string().optional(), // optional
  image: z.string().url().optional(), // optional
  callbackURL: z.string().url().optional(), // optional
});

export const signUp = validatedAction(signUpSchema, async (data, formData) => {
  const { name, email, password, inviteId, image } = data;

  const { user: createdUser } = await auth.api.signUpEmail({
    body: {
      name: name || "",
      email,
      password,
      image,
    },
  });

  let clinicId: number;
  let userRole: string;
  let createdClinic: typeof clinics.$inferSelect | null = null;

  if (inviteId) {
    // Check if there's a valid invitation
    const [invitation] = await db
      .select()
      .from(invitations_old)
      .where(
        and(
          eq(invitations_old.id, parseInt(inviteId)),
          eq(invitations_old.email, email),
          eq(invitations_old.status, "pending")
        )
      )
      .limit(1);

    if (invitation) {
      clinicId = invitation.clinicId;
      userRole = invitation.role;

      await db
        .update(invitations_old)
        .set({ status: "accepted" })
        .where(eq(invitations_old.id, invitation.id));

      await logActivity(
        clinicId,
        createdUser.id,
        ActivityType.ACCEPT_INVITATION
      );

      [createdClinic] = await db
        .select()
        .from(clinics)
        .where(eq(clinics.id, clinicId))
        .limit(1);
    } else {
      return { error: "Invalid or expired invitation.", email, password };
    }
  } else {
    // Create a new clinic if there's no invitation
    const newClinic: NewClinic = {
      name: name ? `${name}'s Clinic` : `${email}'s Clinic`,
    };

    [createdClinic] = await db.insert(clinics).values(newClinic).returning();

    if (!createdClinic) {
      return {
        error: "Failed to create clinic. Please try again.",
        email,
        password,
      };
    }

    clinicId = createdClinic.id;
    userRole = "owner";

    await logActivity(clinicId, createdUser.id, ActivityType.CREATE_CLINIC);
  }

  const newClinicMember: NewClinicMember = {
    userId: createdUser.id,
    clinicId,
    role: userRole,
  };

  await Promise.all([
    db.insert(clinicMembers).values(newClinicMember),
    logActivity(clinicId, createdUser.id, ActivityType.SIGN_UP),
  ]);

  const redirectTo = formData.get("redirect") as string | null;
  if (redirectTo === "checkout") {
    const priceId = formData.get("priceId") as string;
    return createCheckoutSession({ clinic: createdClinic, priceId });
  }

  redirect("/dashboard");
});

export async function signOut() {
  const user = (await getUser()) as User;
  const userWithClinic = await getUserWithClinic(user.id);
  await logActivity(userWithClinic?.clinicId, user.id, ActivityType.SIGN_OUT);
  await auth.api.signOut({ headers: await headers() });
}

const updatePasswordSchema = z.object({
  currentPassword: z.string().min(8).max(100),
  newPassword: z.string().min(8).max(100),
  confirmPassword: z.string().min(8).max(100),
});

export const updatePassword = validatedActionWithUser(
  updatePasswordSchema,
  async (data, _, user) => {
    const { currentPassword, newPassword, confirmPassword } = data;

    if (currentPassword === newPassword) {
      return {
        currentPassword,
        newPassword,
        confirmPassword,
        error: "New password must be different from the current password.",
      };
    }
    if (confirmPassword !== newPassword) {
      return {
        currentPassword,
        newPassword,
        confirmPassword,
        error: "New password and confirmation password do not match.",
      };
    }

    try {
      const res = await auth.api.changePassword({
        body: {
          newPassword,
          currentPassword,
          revokeOtherSessions: true,
        },
        // This endpoint requires session cookies.
        headers: await headers(),
      });

      const userWithClinic = await getUserWithClinic(user.id);
      logActivity(
        userWithClinic?.clinicId,
        user.id,
        ActivityType.UPDATE_PASSWORD
      );

      return {
        success: "Password updated successfully.",
      };
    } catch (error: any) {
      const code = error?.body?.code ?? error?.body?.message;
      const message =
        code && changePasswordErrorMap[code]
          ? changePasswordErrorMap[code]
          : "Something went wrong while updating your password. Please try again.";
      return { currentPassword, newPassword, confirmPassword, error: message };
    }
  }
);

const deleteAccountSchema = z.object({
  password: z.string().min(8).max(100),
});

export const deleteAccount = validatedActionWithUser(
  deleteAccountSchema,
  async (data, _, user) => {
    const { password } = data;

    const isPasswordValid = await comparePasswords(password, user.passwordHash);
    if (!isPasswordValid) {
      return {
        password,
        error: "Incorrect password. Account deletion failed.",
      };
    }

    const userWithClinic = await getUserWithClinic(user.id);

    await logActivity(
      userWithClinic?.clinicId,
      user.id,
      ActivityType.DELETE_ACCOUNT
    );

    // Soft delete
    await db
      .update(users)
      .set({
        deletedAt: sql`CURRENT_TIMESTAMP`,
        email: sql`CONCAT(email, '-', id, '-deleted')`, // Ensure email uniqueness
      })
      .where(eq(users.id, user.id));

    if (userWithClinic?.clinicId) {
      await db
        .delete(clinicMembers)
        .where(
          and(
            eq(clinicMembers.userId, user.id),
            eq(clinicMembers.clinicId, userWithClinic.clinicId)
          )
        );
    }

    (await cookies()).delete("session");
    redirect("/sign-in");
  }
);

const updateAccountSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  email: z.string().email("Invalid email address"),
});

export const updateAccount = validatedActionWithUser(
  updateAccountSchema,
  async (data, _, user) => {
    const { name, email } = data;
    const userWithClinic = await getUserWithClinic(user.id);

    await Promise.all([
      db.update(users).set({ name, email }).where(eq(users.id, user.id)),
      logActivity(
        userWithClinic?.clinicId,
        user.id,
        ActivityType.UPDATE_ACCOUNT
      ),
    ]);

    return { name, success: "Account updated successfully." };
  }
);

const removeClinicMemberSchema = z.object({
  memberId: z.number(),
});

export const removeClinicMember = validatedActionWithUser(
  removeClinicMemberSchema,
  async (data, _, user) => {
    const { memberId } = data;
    const userWithClinic = await getUserWithClinic(user.id);

    if (!userWithClinic?.clinicId) {
      return { error: "User is not part of a clinic" };
    }

    await db
      .delete(clinicMembers)
      .where(
        and(
          eq(clinicMembers.id, memberId),
          eq(clinicMembers.clinicId, userWithClinic.clinicId)
        )
      );

    await logActivity(
      userWithClinic.clinicId,
      user.id,
      ActivityType.REMOVE_CLINIC_MEMBER
    );

    return { success: "Clinic member removed successfully" };
  }
);

const inviteClinicMemberSchema = z.object({
  email: z.string().email("Invalid email address"),
  role: z.enum(["member", "owner"]),
});

export const inviteClinicMember = validatedActionWithUser(
  inviteClinicMemberSchema,
  async (data, _, user) => {
    const { email, role } = data;
    const userWithClinic = await getUserWithClinic(user.id);

    if (!userWithClinic?.clinicId) {
      return { error: "User is not part of a clinic" };
    }

    const existingMember = await db
      .select()
      .from(users)
      .leftJoin(clinicMembers, eq(users.id, clinicMembers.userId))
      .where(
        and(
          eq(users.email, email),
          eq(clinicMembers.clinicId, userWithClinic.clinicId)
        )
      )
      .limit(1);

    if (existingMember.length > 0) {
      return { error: "User is already a member of this clinic" };
    }

    // Check if there's an existing invitation
    const existingInvitation = await db
      .select()
      .from(invitations_old)
      .where(
        and(
          eq(invitations_old.email, email),
          eq(invitations_old.clinicId, userWithClinic.clinicId),
          eq(invitations_old.status, "pending")
        )
      )
      .limit(1);

    if (existingInvitation.length > 0) {
      return { error: "An invitation has already been sent to this email" };
    }

    // Create a new invitation
    await db.insert(invitations_old).values({
      clinicId: userWithClinic.clinicId,
      email,
      role,
      invitedBy: user.id,
      status: "pending",
    });

    await logActivity(
      userWithClinic.clinicId,
      user.id,
      ActivityType.INVITE_CLINIC_MEMBER
    );

    // TODO: Send invitation email and include ?inviteId={id} to sign-up URL
    // await sendInvitationEmail(email, userWithClinic.clinic.name, role)

    return { success: "Invitation sent successfully" };
  }
);
