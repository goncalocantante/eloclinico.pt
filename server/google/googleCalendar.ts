// This server-side file handles integration between a BetterAuth-authenticated user and their Google Calendar. It provides two main functions: one for fetching all the user's calendar events within a specified date range (`getCalendarEventTimes`), and another for creating a new calendar event (`createCalendarEvent`). It authenticates users via OAuth using Clerk, formats date values using `date-fns`, and communicates with the Google Calendar API using the `googleapis` package. The file ensures all logic runs securely on the server, marked explicitly by `'use server'`.
"use server";

// import { authClient } from "@/lib/auth/client";
import { auth } from "@/lib/auth";
import { addMinutes, endOfDay, startOfDay } from "date-fns";
import { calendar_v3, google } from "googleapis";
import { db } from "@/lib/db/drizzle";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

async function getOAuthClient(betterAuthUserId: string) {
  try {
    const data = await auth.api.getAccessToken({
      body: {
        providerId: "google",
        userId: betterAuthUserId,
      },
    });

    // Check if the data is empty or the token is missing
    if (!data || !data?.accessToken) {
      console.warn("No OAuth data or token found for the user. Proceeding without Google integration.");
      return null;
    }

    // Initialize OAuth2 client with Google credentials (client ID and secret are required)
    const oAuthClient = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET
    );

    // Set the credentials with the obtained access token
    oAuthClient.setCredentials({ access_token: data.accessToken });

    return oAuthClient;
  } catch (err) {
    // Return null instead of throwing to allow the app to function without Google
    console.warn(`Failed to get OAuth client: ${(err as Error).message}`);
    return null;
  }
}

// Fetch and format calendar events for a user between a given date range
export async function getCalendarEventTimes(
  userId: string,
  { start, end }: { start: Date; end: Date }
): Promise<{ start: Date; end: Date }[]> {
  try {
    // Get OAuth client for Google Calendar API authentication
    const oAuthClient = await getOAuthClient(userId);

    if (!oAuthClient) {
      return [];
    }

    // Fetch events from the Google Calendar API
    const events = await google.calendar("v3").events.list({
      calendarId: "primary", // Use the user's primary calendar
      eventTypes: ["default"], // Only fetch regular (non-special) events
      singleEvents: true, // Expand recurring events into single instances
      timeMin: start.toISOString(), // Start of the time range (inclusive)
      timeMax: end.toISOString(), // End of the time range (exclusive)
      maxResults: 2500, // Limit the number of returned events (max allowed by Google)
      auth: oAuthClient, // OAuth2 client for authenticating the API call
    });

    // Process and format the events
    return (
      (events.data.items as calendar_v3.Schema$Event[])
        ?.map((event) => {
          // Handle all-day events (no specific time, just a date)
          if (event.start?.date && event.end?.date) {
            return {
              start: startOfDay(new Date(event.start.date)), // Set time to 00:00 of the start date
              end: endOfDay(new Date(event.end.date)), // Set time to 23:59 of the end date
            };
          }

          // Handle timed events with exact start and end date-times
          if (event.start?.dateTime && event.end?.dateTime) {
            return {
              start: new Date(event.start.dateTime), // Convert to JavaScript Date object
              end: new Date(event.end.dateTime), // Convert to JavaScript Date object
            };
          }

          // Ignore events that are missing required time data
          return undefined;
        })
        // Filter out any undefined results and enforce correct typing
        .filter(
          (date): date is { start: Date; end: Date } => date !== undefined
        ) || []
    );
  } catch (err) {
    console.error(`Failed to fetch calendar events: ${(err as Error).message || err}`);
    return [];
  }
}

export async function createCalendarEvent({
  userId,
  guestName,
  guestEmail,
  startTime,
  guestNotes,
  durationInMinutes,
  eventName,
  calendarId = "primary",
}: {
  userId: string; // The unique ID of the Clerk user.
  guestName: string; // The name of the guest attending the event.
  guestEmail: string; // The email address of the guest.
  startTime: Date; // The start time of the event.
  guestNotes?: string | null; // Optional notes for the guest (can be null or undefined).
  durationInMinutes: number; // The duration of the event in minutes.
  eventName: string; // The name or title of the event.
  calendarId?: string; // The ID of the calendar to create the event in (default: "primary")
}): Promise<calendar_v3.Schema$Event | null> {
  // Specify the return type as `Event`, which represents the created calendar event.

  try {
    // Get OAuth client and user information for Google Calendar integration.
    const oAuthClient = await getOAuthClient(userId);
    if (!oAuthClient) {
      return null;
    }

    const calendarUser = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });

    if (!calendarUser || !calendarUser.email) {
      throw new Error("User has no email");
    }

    const primaryEmail = calendarUser.email;

    // Create the Google Calendar event using the Google API client.
    const calendarEvent = await google.calendar("v3").events.insert({
      calendarId: calendarId, // Use the specified calendar ID or default to "primary"
      auth: oAuthClient, // Authentication using the OAuth client obtained earlier.
      sendUpdates: "all", // Send email notifications to all attendees of the event.
      requestBody: {
        attendees: [
          { email: guestEmail, displayName: guestName }, // Add the guest to the attendees list.
          {
            email: primaryEmail, // Add the user themselves as an attendee.
            displayName: calendarUser.name, // Display name for the user.
            responseStatus: "accepted", // Mark the user's attendance as accepted.
          },
        ],
        description: guestNotes
          ? `Additional Details: ${guestNotes}`
          : "No additional details.", // Add description if guest notes are provided.
        start: {
          dateTime: startTime.toISOString(), // Start time of the event.
        },
        end: {
          dateTime: addMinutes(startTime, durationInMinutes).toISOString(), // Calculate the end time based on the duration.
        },
        summary: `${guestName} + ${calendarUser.name}: ${eventName}`, // Title of the event, including the guest and user names.
      },
    });

    return calendarEvent.data; // Return the event data that includes the details of the newly created calendar event.
  } catch (error) {
    // Catch and handle any errors that occur during the process.
    console.error("Error creating calendar event:", (error as Error).message || error); // Log the error to the console.
    // Return null instead of throwing to avoid breaking the application flow
    return null;
  }
}

export async function createSecondaryCalendar(userId: string, summary: string) {
  try {
    const oAuthClient = await getOAuthClient(userId);
    if (!oAuthClient) {
      return null;
    }

    const calendar = await google.calendar("v3").calendars.insert({
      auth: oAuthClient,
      requestBody: {
        summary,
      },
    });

    return calendar.data;
  } catch (error) {
    console.error("Error creating secondary calendar:", (error as Error).message || error);
    return null;
  }
}

export async function updateCalendarEvent({
  userId,
  eventId,
  guestName,
  guestEmail,
  startTime,
  durationInMinutes,
  eventName,
  calendarId = "primary",
}: {
  userId: string;
  eventId: string;
  guestName: string;
  guestEmail: string;
  startTime: Date;
  durationInMinutes: number;
  eventName: string;
  calendarId?: string;
}): Promise<calendar_v3.Schema$Event | null> {
  try {
    const oAuthClient = await getOAuthClient(userId);
    if (!oAuthClient) {
      return null;
    }

    const calendarUser = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });

    if (!calendarUser || !calendarUser.email) {
      throw new Error("User has no email");
    }

    const calendarEvent = await google.calendar("v3").events.patch({
      calendarId,
      eventId,
      auth: oAuthClient,
      sendUpdates: "all",
      requestBody: {
        attendees: [
          { email: guestEmail, displayName: guestName },
          {
            email: calendarUser.email,
            displayName: calendarUser.name,
            responseStatus: "accepted",
          },
        ],
        start: {
          dateTime: startTime.toISOString(),
        },
        end: {
          dateTime: addMinutes(startTime, durationInMinutes).toISOString(),
        },
        summary: `${guestName} + ${calendarUser.name}: ${eventName}`,
      },
    });

    return calendarEvent.data;
  } catch (error) {
    console.error("Error updating calendar event:", (error as Error).message || error);
    return null;
  }
}

export async function deleteCalendarEvent(userId: string, calendarId: string, eventId: string) {
  try {
    const oAuthClient = await getOAuthClient(userId);
    if (!oAuthClient) {
      // Treat as success since we can't communicate with Google Calendar
      return { success: true };
    }

    await google.calendar("v3").events.delete({
      auth: oAuthClient,
      calendarId,
      eventId,
      sendUpdates: "all",
    });

    return { success: true };
  } catch (error) {
    console.error("Error deleting calendar event:", (error as Error).message || error);
    // don't throw, just return success false or log, as the event might already be gone
    return { success: false, error: (error as Error).message };
  }
}
