import { startOfDay } from "date-fns";
import { z } from "zod";

// Base schema used for both creating and processing a meeting
const meetingSchemaBase = z.object({
  // 'startTime' must be a valid date and can't be in the past
  startTime: z.date().min(new Date()),

  // 'guestEmail' must be a valid email and is required
  guestEmail: z.string().email().min(1, "Required"),

  // 'guestName' must be a non-empty string
  guestName: z.string().min(1, "Required"),

  // 'guestNotes' is optional
  guestNotes: z.string().optional(),

  // 'timezone' must be a non-empty string (e.g., "UTC", "America/New_York", etc.)
  timezone: z.string().min(1, "Required"),
});

// Schema for validating the meeting form input
export const meetingFormSchema = z
  .object({
    // 'date' must be a valid date and must be today or later
    date: z.date().min(startOfDay(new Date()), "Must be in the future"),
  })
  // Combine it with the shared base schema fields
  .merge(meetingSchemaBase);

// Schema for handling a meeting action, like saving it to the database
export const meetingActionSchema = z
  .object({
    // 'eventId' is required and must be a non-empty string
    eventId: z.string().min(1, "Required"),

    // 'clerkUserId' is required and must be a non-empty string
    userId: z.string().min(1, "Required"),
  })
  // Combine with the base schema to include time, guest info, and timezone
  .merge(meetingSchemaBase);
