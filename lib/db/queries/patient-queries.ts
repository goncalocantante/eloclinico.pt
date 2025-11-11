import { getUser } from "./queries";
import { db } from "../drizzle";
import { patients } from "@/lib/db/schema";

export async function getPatients() {
  const user = await getUser();
  if (!user) {
    throw new Error("User not authenticated");
  }

  // todo - at the moment its returning all patients for the database,
  // eventually has to return patients for a specific psychologist
  const patientsRes = await db.select().from(patients);

  return patientsRes;
}
