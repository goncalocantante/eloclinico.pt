import { z } from "zod";

export const eventSchema = z.object({
  userId: z.uuid().optional(),
  patientId: z.uuid().optional(),
  title: z.string().optional(),
  appointmentType: z.uuid(),
  startDate: z.date().optional(),
  startTime: z.iso.time({ precision: -1 }).optional(),
  endTime: z.iso.time({ precision: -1 }).optional(),
  notes: z.string().optional(),
  color: z
    .enum(["blue", "green", "red", "yellow", "purple", "orange", "gray"])
    .optional(),
});

export type TEventFormData = z.infer<typeof eventSchema>;
