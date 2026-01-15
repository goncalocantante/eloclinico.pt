// This code defines a **Next.js server component** that displays a success page after a user books an event. It takes in URL parameters (`clerkUserId` and `eventId`) and a query parameter (`startTime`), then queries the database for a matching active event. If no event is found, it shows a 404 page. Otherwise, it fetches the user's details from Clerk, formats the provided `startTime` into a readable format, and displays a confirmation message indicating the event name, the user's full name, and the scheduled time. It also informs the user that an email confirmation will be sent, signaling that the booking was successful.

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatDateTime } from "@/lib/formatters";
import { getEvent } from "@/server/actions/events";
import { AlertTriangle } from "lucide-react";

import { getUser } from "@/lib/db/queries/queries";

// The default async function to render the success page
export default async function SuccessPage({
  params,
  searchParams,
}: {
  // Define expected route parameters and search parameters
  params: Promise<{ clerkUserId: string; eventId: string }>;
  searchParams: Promise<{ startTime: string }>;
}) {
  const { clerkUserId, eventId } = await params;
  const { startTime } = await searchParams;
  // Query the database to find the specific active event that matches the user and event ID
  const event = await getEvent(clerkUserId, eventId);
  // If event doesn't exist, show a 404 page
  if (!event)
    return (
      <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-md flex items-center gap-2 text-sm max-w-md mx-auto mt-6">
        <AlertTriangle className="w-5 h-5" />
        <span>This event doesn&apos;t exist anymore.</span>
      </div>
    );

  // Fetch the user details from Clerk based on the user ID
  const calendarUser = await getUser();
  if (!calendarUser) {
    throw new Error("User is not authenticated");
  }
  // Convert the received start time string to a JavaScript Date object
  const startTimeDate = new Date(startTime);

  // Render the success message with event and user details
  return (
    <Card className="max-w-xl mx-auto border-8 border-blue-200 shadow-2xl shadow-accent-foreground">
      <CardHeader>
        <CardTitle>
          ✅Successfully Booked {event.name} with {calendarUser.name}
        </CardTitle>
        {/* Format and display the booking date/time */}
        <CardDescription>{formatDateTime(startTimeDate)}</CardDescription>
      </CardHeader>
      <CardContent>
        {/* Inform the user that a confirmation email is on its way */}
          You&apos;ll receive a calendar invitation shortly. You can safely close
        this page now.
      </CardContent>
    </Card>
  );
}
