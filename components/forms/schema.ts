import { z } from "zod";

// Define a validation schema for the event form using Zod
export const eventFormSchema = z.object({
  // 'name' must be a string and is required (at least 1 character)
  name: z.string().min(1, "Required"),

  // 'description' is an optional string field
  description: z.string().optional(),

  // 'isActive' is a boolean value that defaults to true if not provided
  isActive: z.boolean(),

  // 'durationInMinutes' will be coerced (converted) to a number
  // It must be an integer, greater than 0, and less than or equal to 720 (12 hours)
  durationInMinutes: z.coerce
    .number()
    .int()
    .positive("Duration must be greater than 0")
    .max(60 * 12, `Duration must be less than 12 hours (${60 * 12} minutes)`),
});
