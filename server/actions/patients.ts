"use server"; // Marks this file as a Server Action - required for Next.js App Router

import { db } from "@/lib/db/drizzle";
import { eventFormSchema } from "@/components/forms/schema";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getUser } from "@/lib/db/queries/queries";

import { createClientFormSchema } from "@/schema/patients";

import { patients } from "@/lib/db/schema";

import {
  validatedAction,
  validatedActionWithUser,
} from "@/lib/auth/middleware";

// export const createPatient = validatedAction(
//   createClientFormSchema,
//   async (data, formData) => {
//     // const { email, password } = data;
//     console.log("data: ", data);
//   }
// );

export const createPatient = async (data: any) => {
  const { name, email, phone, birthdate: dateOfBirth } = data;
  console.log("data: ", data);

  await db.insert(patients).values({ name, email, phone, dateOfBirth });
};
