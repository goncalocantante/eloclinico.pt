import { z } from "zod";

export const eventSchema = z.object({
  userId: z.uuid().optional(),
  patientId: z.string({ message: "Selecione um paciente" }).min(1, "Selecione um paciente"),
  title: z.string().optional(),
  appointmentType: z.string({ message: "Selecione o tipo de consulta" }).min(1, "Selecione o tipo de consulta"),
  startDate: z.date({ message: "Selecione uma data" }),
  startTime: z.string({ message: "Selecione a hora de início" }).min(1, "Selecione a hora de início"),
  endTime: z.string({ message: "Selecione a hora de fim" }).min(1, "Selecione a hora de fim"),
  notes: z.string().optional(),
  color: z.enum(
    ["blue", "green", "red", "yellow", "purple", "orange", "gray"] as const,
    { message: "Selecione uma cor" }
  ),
});

export type TEventFormData = z.infer<typeof eventSchema>;
