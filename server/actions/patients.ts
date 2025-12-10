"use server"; // Marks this file as a Server Action - required for Next.js App Router

import { db } from "@/lib/db/drizzle";
import { revalidatePath, revalidateTag } from "next/cache";
import { getPatients as getPatientsQuery } from "@/lib/db/queries/patient-queries";
import { patients } from "@/lib/db/schema";
import type { Patient } from "@/lib/db/schema";

/**
 * Server action to fetch patients with cache tagging
 * Use revalidateTag("patients") to invalidate this cache
 */
export async function getPatients(): Promise<Patient[]> {
  const patientsData = await getPatientsQuery();
  return patientsData;
}

export const createPatient = async (data: any) => {
  const { name, email, phone, birthdate: dateOfBirth } = data;

  await db.insert(patients).values({ name, email, phone, dateOfBirth });
  
  // Revalidate the patients page and cache
  revalidatePath("/dashboard/patients");
  revalidateTag("patients");
};
