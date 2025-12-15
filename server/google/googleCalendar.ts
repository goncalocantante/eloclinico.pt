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

    // Check if the data is empty or the token is missing, throw an error
    if (!data || !data?.accessToken) {
      throw new Error("No OAuth data or token found for the user.");
    }

    // Initialize OAuth2 client with Google credentials (client ID and secret are required)
    const oAuthClient = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET
    );

    // Set the credentials with the obtained access token
    oAuthClient.setCredentials({ access_token: data.accessToken });

    return oAuthClient;
  } catch (err: any) {
    // Catch any errors and rethrow with a detailed message
    throw new Error(`Failed to get OAuth client: ${err.message}`);
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
      throw new Error("OAuth client could not be obtained.");
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
      events.data.items
        ?.map((event: any) => {
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
          // todo fix "any"
          (date: any): date is { start: Date; end: Date } => date !== undefined
        ) || []
    );
  } catch (err: any) {
    throw new Error(`Failed to fetch calendar events: ${err.message || err}`);
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
}: {
  userId: string; // The unique ID of the Clerk user.
  guestName: string; // The name of the guest attending the event.
  guestEmail: string; // The email address of the guest.
  startTime: Date; // The start time of the event.
  guestNotes?: string | null; // Optional notes for the guest (can be null or undefined).
  durationInMinutes: number; // The duration of the event in minutes.
  eventName: string; // The name or title of the event.
}): Promise<calendar_v3.Schema$Event> {
  // Specify the return type as `Event`, which represents the created calendar event.

  try {
    // Get OAuth client and user information for Google Calendar integration.
    const oAuthClient = await getOAuthClient(userId);
    if (!oAuthClient) {
      throw new Error("OAuth client could not be obtained."); // Error handling if OAuth client is not available.
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
      calendarId: "primary", // Use the primary calendar of the user.
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
  } catch (error: any) {
    // Catch and handle any errors that occur during the process.
    console.error("Error creating calendar event:", error.message || error); // Log the error to the console.
    throw new Error(
      `Failed to create calendar event: ${error.message || error}`
    ); // Throw a new error with a detailed message.
  }
}
