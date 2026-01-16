import { getEvent } from "@/server/actions/events";
import { AlertTriangle } from "lucide-react";
import {
  addYears,
  eachMinuteOfInterval,
  endOfDay,
  roundToNearestMinutes,
} from "date-fns";
import { getValidTimesFromSchedule } from "@/server/actions/schedule";
import NoTimeSlots from "@/components/no-time-slots";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import MeetingForm from "@/components/forms/meeting-form";
import { getUser } from "@/lib/db/queries/queries";

export default async function BookingPage({
  params,
}: {
  params: Promise<{ userId: string; eventId: string }>;
}) {
  const { userId, eventId } = await params;

  // Fetch the event details from the database using the provided user and event IDs
  const event = await getEvent(userId, eventId);
  // If event doesn't exist, show a 404 page
  if (!event)
    return (
      <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-md flex items-center gap-2 text-sm max-w-md mx-auto mt-6">
        <AlertTriangle className="w-5 h-5" />
        <span>This event doesn&apos;t exist anymore.</span>
      </div>
    );

  // Get the full user object from db
  const user = await getUser();
  if (!user) {
    throw new Error("User is not authenticated");
  }

  // Define a date range from now (rounded up to the nearest 15 minutes) to 1 year later
  const startDate = roundToNearestMinutes(new Date(), {
    nearestTo: 15,
    roundingMethod: "ceil",
  });

  const endDate = endOfDay(addYears(startDate, 1)); // Set range to 1 year ahead

  // Generate valid available time slots for the event using the custom scheduler logic
  const validTimes = await getValidTimesFromSchedule(
    eachMinuteOfInterval({ start: startDate, end: endDate }, { step: 15 }),
    event
  );

  // If no valid time slots are available, show a message and an option to pick another event
  if (validTimes.length === 0) {
    return <NoTimeSlots event={event} calendarUser={user} />;
  }

  // Render the booking form with the list of valid available times
  // We&apos;re looking forward to seeing you!
  return (
    <Card className="max-w-4xl mx-auto border-8 border-blue-200 shadow-2xl shadow-accent-foreground">
      <CardHeader>
        <CardTitle>
          Book {event.name} with {user.name}
        </CardTitle>
        {event.description && (
          <CardDescription>{event.description}</CardDescription>
        )}
      </CardHeader>
      <CardContent>
        <MeetingForm
          validTimes={validTimes}
          eventId={event.id}
          userId={userId}
        />
      </CardContent>
    </Card>
  );
}
