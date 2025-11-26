"use server";

import { db } from "@/lib/db/drizzle";
import { meetingActionSchema } from "@/schema/meetings";
import { fromZonedTime } from "date-fns-tz";
import { getValidTimesFromSchedule } from "./schedule";
import { createCalendarEvent } from "../google/googleCalendar";
import { z } from "zod";

//Server action to create a meeting
export async function createMeeting(
  unsafeData: z.infer<typeof meetingActionSchema> // Incoming data, inferred from the meetingActionSchema
) {
  try {
    // Validate the incoming data against the schema
    const { success, data } = meetingActionSchema.safeParse(unsafeData);

    // If validation fails, throw an error
    if (!success) {
      throw new Error("Invalid data.");
    }

    // Try to find the event in the database that matches the provided IDs and is active
    const event = await db.query.events.findFirst({
      where: ({ userId, isActive, id }, { eq, and }) =>
        and(
          eq(isActive, true), // Event must be active
          eq(userId, data.userId), // Belonging to the right user
          eq(id, data.eventId) // Matching the event ID
        ),
    });

    // If no matching event is found, throw an error
    if (!event) {
      throw new Error("Event not found.");
    }

    // Interpret the start time as being in the user's timezone and convert it to a UTC Date
    const startInTimezone = fromZonedTime(data.startTime, data.timezone);

    // Check if the selected time is valid for the event's availability
    const validTimes = await getValidTimesFromSchedule(
      [startInTimezone],
      event
    );

    // If the selected time is not valid, throw an error
    if (validTimes.length === 0) {
      throw new Error("Selected time is not valid.");
    }

    // Create the Google Calendar event with all necessary details
    await createCalendarEvent({
      ...data, // guest info, timezone, etc.
      startTime: startInTimezone, // adjusted to the right timezone
      durationInMinutes: event.durationInMinutes, // use duration from the event
      eventName: event.name, // use event name from DB
    });
    return {
      userId: data.userId,
      eventId: data.eventId,
      startTime: data.startTime,
    };
  } catch (error: any) {
    // Log the error message (or handle it based on your need)
    console.error(`Error creating meeting: ${error.message || error}`);
    // Optionally throw the error to be handled further upstream
    throw new Error(`Failed to create meeting: ${error.message || error}`);
  }
}
