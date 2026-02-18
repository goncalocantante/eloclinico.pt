import { getEvent } from "@/server/actions/events";
import { AlertTriangle, Clock, Calendar as CalendarIcon } from "lucide-react";
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
import { getPublicProfile } from "@/lib/db/queries/queries";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { notFound } from "next/navigation";

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

  // Get the public user profile from db
  const user = await getPublicProfile(userId);
  if (!user) {
    notFound();
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
    <div className="max-w-4xl mx-auto p-6 md:p-10">
      <Card className="border-none shadow-none md:border md:shadow-sm">
        <CardHeader className="text-center space-y-4 pb-8 border-b">
          <div className="flex justify-center">
            <Avatar className="h-20 w-20 border-4 border-white shadow-md">
              <AvatarImage
                src={`https://api.dicebear.com/9.x/initials/svg?seed=${user.name}`}
              />
              <AvatarFallback>
                {user.name
                  ?.split(" ")
                  .map((n: string) => n[0])
                  .join("")}
              </AvatarFallback>
            </Avatar>
          </div>
          <div className="space-y-2">
            <CardTitle className="text-2xl md:text-3xl">
              Book {event.name}
            </CardTitle>
            <div className="flex items-center justify-center gap-2 text-muted-foreground text-sm">
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4" /> {event.durationInMinutes} mins
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <CalendarIcon className="w-4 h-4" /> with {user.name}
              </span>
            </div>
          </div>
          {event.description && (
            <CardDescription className="max-w-lg mx-auto text-base">
              {event.description}
            </CardDescription>
          )}
        </CardHeader>
        <CardContent className="pt-8">
          <MeetingForm
            validTimes={validTimes}
            eventId={event.id}
            userId={userId}
          />
        </CardContent>
      </Card>
    </div>
  );
}
