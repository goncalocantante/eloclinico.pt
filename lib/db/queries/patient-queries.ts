import { getUser } from "./queries";
import { db } from "../drizzle";
import { patients } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function getPatients() {
  const user = await getUser();
  if (!user) {
    throw new Error("User not authenticated");
  }

  const patientsRes = await db
    .select()
    .from(patients)
    .where(eq(patients.userId, user.id));

  return patientsRes;
}
