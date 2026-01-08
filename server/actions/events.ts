"use server"; // Marks this file as a Server Action - required for Next.js App Router

import { db } from "@/lib/db/drizzle";
import { events } from "@/lib/db/schema";
import { eventFormSchema } from "@/components/forms/schema";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getUser } from "@/lib/db/queries/queries";

// This function creates a new event in the database after validating the input data.
export async function createEvent(
  unsafeData: z.infer<typeof eventFormSchema> // Accepts raw event data validated by the zod schema
): Promise<void> {
  try {
    // Authenticate the user using Clerk
    const user = await getUser();
    const userId = user?.id;
    // Validate the incoming data against the event form schema
    const { success, data } = eventFormSchema.safeParse(unsafeData);

    // If validation fails or the user is not authenticated, throw an error
    if (!success || !userId) {
      throw new Error("Invalid event data or user not authenticated.");
    }

    // Insert the validated event data into the database, linking it to the authenticated user
    await db.insert(events).values({ ...data, userId });
  } catch (error: any) {
    // If any error occurs during the process, throw a new error with a readable message
    throw new Error(`Failed to book appointment: ${error.message || error}`);
  } finally {
    // Revalidate the '/events' path to ensure the page fetches fresh data after the database operation
    revalidatePath("/dashboard/calendar/events");
  }
}

// This function updates an existing event in the database after validating the input and checking ownership.
export async function updateEvent(
  id: string, // ID of the event to update
  unsafeData: z.infer<typeof eventFormSchema> // Raw event data to validate and update
): Promise<void> {
  try {
    // Authenticate the user
    const user = await getUser();
    const userId = user?.id;

    // Validate the incoming data against the event form schema
    const { success, data } = eventFormSchema.safeParse(unsafeData);

    // If validation fails or the user is not authenticated, throw an error
    if (!success || !userId) {
      throw new Error("Invalid event data or user not authenticated.");
    }

    // Attempt to update the event in the database
    const rowCount = await db
      .update(events)
      .set({ ...data }) // Update with validated data
      .where(and(eq(events.id, id), eq(events.userId, userId)))
      .returning(); // Ensure user owns the event

    // If no event was updated (either not found or not owned by the user), throw an error
    if (rowCount.length === 0) {
      throw new Error(
        "Event not found or user not authorized to update this event."
      );
    }
  } catch (error: any) {
    // If any error occurs, throw a new error with a readable message
    throw new Error(`Failed to update event: ${error.message || error}`);
  } finally {
    // Revalidate the '/events' path to ensure the page fetches fresh data after the database operation
    revalidatePath("/dashboard/calendar/events");
  }
}

// This function deletes an existing event from the database after checking user ownership.
export async function deleteEvent(
  id: string // ID of the event to delete
): Promise<void> {
  try {
    // Authenticate the user
    const user = await getUser();
    const userId = user?.id;

    // Throw an error if no authenticated user
    if (!userId) {
      throw new Error("User not authenticated.");
    }

    // Attempt to delete the event only if it belongs to the authenticated user
    const rowCount = await db
      .delete(events)
      .where(and(eq(events.id, id), eq(events.userId, userId)));

    // If no event was deleted (either not found or not owned by user), throw an error
    if (rowCount.length === 0) {
      throw new Error(
        "Event not found or user not authorized to delete this event."
      );
    }
  } catch (error: any) {
    // If any error occurs, throw a new error with a readable message
    throw new Error(`Failed to delete event: ${error.message || error}`);
  } finally {
    // Revalidate the '/events' path to ensure the page fetches fresh data after the database operation
    revalidatePath("/dashboard/calendar/events");
  }
}

// Infer the type of a row from the events schema
type EventRow = typeof events.$inferSelect;

// Async function to fetch all events (active and inactive) for a specific user
export async function getEvents(): Promise<EventRow[]> {
  // Authenticate the user
  const user = await getUser();
  const userId = user?.id;

  // Throw an error if no authenticated user
  if (!userId) {
    throw new Error("User not authenticated.");
  }
  // Query the database for events where the authUserId matches
  const events = await db.query.events.findMany({
    where: ({ userId: userIdCol }, { eq }) => eq(userIdCol, userId),
    orderBy: ({ name }, { asc, sql }) => asc(sql`lower(${name})`),
  });

  // Return the full list of events
  return events;
}

// Fetch a specific event for a given user
export async function getEvent(
  userIdProp: string,
  eventId: string
): Promise<EventRow | undefined> {
  const event = await db.query.events.findFirst({
    where: ({ id, userId }, { and, eq }) =>
      and(eq(userId, userIdProp), eq(id, eventId)), // Make sure the event belongs to the user
  });

  return event ?? undefined; // Explicitly return undefined if not found
}

// Define a new type for public events, which are always active
// It removes the generic 'isActive' field and replaces it with a literal true
export type PublicEvent = Omit<EventRow, "isActive"> & { isActive: true };
// “This version of an event is guaranteed to be active — no maybe, no false.”

// Async function to fetch all active (public) events for a specific user
export async function getPublicEvents(
  authUserId: string
): Promise<PublicEvent[]> {
  // Query the database for events where:
  // - the authUserId matches
  // - the event is marked as active
  // Events are ordered alphabetically (case-insensitive) by name
  const events = await db.query.events.findMany({
    where: ({ userId: userIdCol, isActive }, { eq, and }) =>
      and(eq(userIdCol, authUserId), eq(isActive, true)),
    orderBy: ({ name }, { asc, sql }) => asc(sql`lower(${name})`),
  });

  // Cast the result to the PublicEvent[] type to indicate all are active
  return events as PublicEvent[];
}
