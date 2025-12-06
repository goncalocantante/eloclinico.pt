"use server";

import {
  validatedAction,
  validatedActionWithUser,
} from "@/lib/auth/middleware";
import { db } from "@/lib/db/drizzle";

import { eventSchema } from "@/calendar/schemas";
import { appointments } from "@/lib/db/schema";
import { getUser } from "@/lib/db/queries/queries";

export const createAppointment = async (data: any) => {
  const user = await getUser();
  if (!user) {
    throw new Error("User is not authenticated");
  }

  const { patient_id, ...incompleteData } = data;

  const result = eventSchema.safeParse(incompleteData);
  if (!result.success) {
    console.log("error: ", result.error);
    return { error: result.error.errors[0].message };
  }

  const dbData = {
    user: user.id,
    patientId: data.patientId,
    title: data.title,
    appointmentType: data.appointmentType,
    startDate: data.startDate,
    endDate: data.startDate,
    startTime: data.startTime,
    endTime: data.endTime,
    description: data.description,
    color: data.color,
  };

  console.log("user: ", user);
  console.log("data: ", data);

  await db.insert(appointments).values(dbData);
};

// export const createAppointment = validatedActionWithUser(
//   eventSchema,
//   async (data, _, user) => {
//     // const { currentPassword, newPassword, confirmPassword } = data;
//     console.log("user: ", user);
//     console.log("data: ", data);

//     const dbData = {
//       user: data.user?.id,
//       title: data.title,
//       description: data.description,
//       startDate: data.startDate,
//       endDate: data.endDate,
//       startHour: data.startTime.hour,
//       startMinute: data.startTime.minute,
//       endHour: data.endTime.hour,
//       endMinute: data.endTime.minute,
//       color: data.color,
//     };

//     await db.insert(appointments).values(dbData);
//   }
// );
