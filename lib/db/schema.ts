import {
  pgTable,
  serial,
  varchar,
  text,
  timestamp,
  integer,
  date,
  uuid,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: varchar("role", { length: 20 }).notNull().default("member"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  deletedAt: timestamp("deleted_at"),
});

export const clinics = pgTable("clinics", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  stripeCustomerId: text("stripe_customer_id").unique(),
  stripeSubscriptionId: text("stripe_subscription_id").unique(),
  stripeProductId: text("stripe_product_id"),
  planName: varchar("plan_name", { length: 50 }),
  subscriptionStatus: varchar("subscription_status", { length: 20 }),
});

export const clinicMembers = pgTable("clinic_members", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id),
  clinicId: integer("clinic_id")
    .notNull()
    .references(() => clinics.id),
  role: varchar("role", { length: 50 }).notNull(),
  joinedAt: timestamp("joined_at").notNull().defaultNow(),
});

export const patients = pgTable("patients", {
  id: uuid("id").primaryKey(),
  name: varchar("name", { length: 100 }),
  email: varchar("email", { length: 255 }).notNull().unique(),
  phone: varchar("phone", { length: 16 }),
  address: varchar("address", { length: 100 }),
  dateOfBirth: date({ mode: "date" }),
  information: text("information"),
  // profileImage: varchar("profileImage", { length: 100 }),
});

export const activityLogs = pgTable("activity_logs", {
  id: serial("id").primaryKey(),
  clinicId: integer("clinic_id")
    .notNull()
    .references(() => clinics.id),
  userId: integer("user_id").references(() => users.id),
  action: text("action").notNull(),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
  ipAddress: varchar("ip_address", { length: 45 }),
});

export const invitations = pgTable("invitations", {
  id: serial("id").primaryKey(),
  clinicId: integer("clinic_id")
    .notNull()
    .references(() => clinics.id),
  email: varchar("email", { length: 255 }).notNull(),
  role: varchar("role", { length: 50 }).notNull(),
  invitedBy: integer("invited_by")
    .notNull()
    .references(() => users.id),
  invitedAt: timestamp("invited_at").notNull().defaultNow(),
  status: varchar("status", { length: 20 }).notNull().default("pending"),
});

export const clinicsRelations = relations(clinics, ({ many }) => ({
  clinicMembers: many(clinicMembers),
  activityLogs: many(activityLogs),
  invitations: many(invitations),
}));

export const usersRelations = relations(users, ({ many }) => ({
  clinicMembers: many(clinicMembers),
  invitationsSent: many(invitations),
}));

export const invitationsRelations = relations(invitations, ({ one }) => ({
  clinic: one(clinics, {
    fields: [invitations.clinicId],
    references: [clinics.id],
  }),
  invitedBy: one(users, {
    fields: [invitations.invitedBy],
    references: [users.id],
  }),
}));

export const clinicMembersRelations = relations(clinicMembers, ({ one }) => ({
  user: one(users, {
    fields: [clinicMembers.userId],
    references: [users.id],
  }),
  clinic: one(clinics, {
    fields: [clinicMembers.clinicId],
    references: [clinics.id],
  }),
}));

export const activityLogsRelations = relations(activityLogs, ({ one }) => ({
  clinic: one(clinics, {
    fields: [activityLogs.clinicId],
    references: [clinics.id],
  }),
  user: one(users, {
    fields: [activityLogs.userId],
    references: [users.id],
  }),
}));

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Clinic = typeof clinics.$inferSelect;
export type NewClinic = typeof clinics.$inferInsert;
export type ClinicMember = typeof clinicMembers.$inferSelect;
export type NewClinicMember = typeof clinicMembers.$inferInsert;
export type Patient = typeof patients.$inferSelect;
export type ActivityLog = typeof activityLogs.$inferSelect;
export type NewActivityLog = typeof activityLogs.$inferInsert;
export type Invitation = typeof invitations.$inferSelect;
export type NewInvitation = typeof invitations.$inferInsert;
export type ClinicDataWithMembers = Clinic & {
  clinicMembers: (ClinicMember & {
    user: Pick<User, "id" | "name" | "email">;
  })[];
};
export type Roles = "owner" | "psychologist" | "patient";
export type UserContext = User & {
  clinicId: number | null;
  effectiveRole: Roles;
};

export enum ActivityType {
  SIGN_UP = "SIGN_UP",
  SIGN_IN = "SIGN_IN",
  SIGN_OUT = "SIGN_OUT",
  UPDATE_PASSWORD = "UPDATE_PASSWORD",
  DELETE_ACCOUNT = "DELETE_ACCOUNT",
  UPDATE_ACCOUNT = "UPDATE_ACCOUNT",
  CREATE_CLINIC = "CREATE_CLINIC",
  REMOVE_CLINIC_MEMBER = "REMOVE_CLINIC_MEMBER",
  INVITE_CLINIC_MEMBER = "INVITE_CLINIC_MEMBER",
  ACCEPT_INVITATION = "ACCEPT_INVITATION",
}
