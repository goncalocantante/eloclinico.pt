"use server"; // Marks this file as a Server Action - required for Next.js App Router

import { db } from "@/lib/db/drizzle";
import { revalidatePath } from "next/cache";
import { getPatients as getPatientsQuery } from "@/lib/db/queries/patient-queries";
import { patients, appointments } from "@/lib/db/schema";
import type { Patient } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { getUser } from "@/lib/db/queries/queries";
import { createClientFormSchema } from "@/schema/patients";
import { z } from "zod";

type ActionResult<T = void> =
  | { success: true; data?: T }
  | { success: false; error: string };

export async function getPatients(): Promise<Patient[]> {
  const patientsData = await getPatientsQuery();
  return patientsData;
}

export const createPatient = async (data: z.infer<typeof createClientFormSchema>): Promise<ActionResult> => {
  const user = await getUser();
  const userId = user?.id;

  if (!userId) {
    return {
      success: false,
      error: "Utilizador não autenticado.",
    };
  }

  try {
    const { name, email, phone, birthdate: dateOfBirth } = data;

    await db
      .insert(patients)
      .values({ name, email, phone, dateOfBirth, userId });

    // Revalidate the patients page and cache
    revalidatePath("/dashboard/patients");

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: (error as Error).message || "Falha ao criar paciente.",
    };
  }
};

export async function deletePatient(id: string): Promise<ActionResult> {
  const user = await getUser();
  const userId = user?.id;

  if (!userId) {
    throw new Error("User not authenticated.");
  }

  // Check if patient exists and belongs to the authenticated user
  const [patient] = await db
    .select()
    .from(patients)
    .where(and(eq(patients.id, id), eq(patients.userId, userId)))
    .limit(1);

  if (!patient) {
    return {
      success: false,
      error: "Paciente não encontrado.",
    };
  }

  // Check if patient has any appointments
  const [existingAppointment] = await db
    .select()
    .from(appointments)
    .where(eq(appointments.patientId, id))
    .limit(1);

  if (existingAppointment) {
    return {
      success: false,
      error:
        "Não é possível eliminar o paciente com consultas agendadas. Por favor, elimine ou reatribua as consultas primeiro.",
    };
  }

  // Delete the patient
  await db.delete(patients).where(eq(patients.id, id));

  // Revalidate the patients page and cache
  revalidatePath("/dashboard/patients");

  return { success: true };
}
