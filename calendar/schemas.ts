import { z } from "zod";

export const APPOINTMENT_TYPES = [
  "Individual Session",
  "Initial Consultation",
  "Follow-up Consultation",
  "Group Session",
  "Other",
] as const;

export const eventSchema = z.object({
  patientId: z.string(),
  appointmentType: z.enum(APPOINTMENT_TYPES, {
    error: "Appointment type is required",
  }),
  startDate: z.preprocess(
    (val) => (typeof val === "string" ? new Date(val) : val),
    z.date()
  ),
  startTime: z.object({ hour: z.number(), minute: z.number() }),
  endTime: z.object({ hour: z.number(), minute: z.number() }),
  description: z.string().optional(),
  color: z.enum(["blue", "green", "red", "yellow", "purple", "orange"]),
});

export type TEventFormData = z.infer<typeof eventSchema>;
