import { z } from "zod";

export const eventSchema = z.object({
  userId: z.uuid().optional(),
  patientId: z.uuid().optional(),
  title: z.string().optional(),
  appointmentType: z.string().min(1, "Appointment type is required"),
  startDate: z.date().optional(),
  startTime: z.iso.time({ precision: -1 }).optional(),
  endTime: z.iso.time({ precision: -1 }).optional(),
  notes: z.string().optional(),
  color: z
    .enum(["blue", "green", "red", "yellow", "purple", "orange"])
    .optional(),
  // scheduleId: z.uuid().optional(),
  appointmentTypeId: z.uuid(),
});

export type TEventFormData = z.infer<typeof eventSchema>;
