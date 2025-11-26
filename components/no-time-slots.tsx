import Link from "next/link";
import { Button } from "./ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./ui/card";

// Component to render when no time slots are available for the selected event
export default function NoTimeSlots({
  event,
  calendarUser,
}: {
  event: { name: string; description: string | null };
  calendarUser: { id: string; name: string | null };
}) {
  return (
    <Card className="max-w-md mx-auto border-4 border-blue-500/10 shadow-2xl transition delay-150 duration-500 ease-in-out hover:-translate-y-1 hover:scale-125">
      <CardHeader>
        <CardTitle>
          Book {event.name} with {calendarUser.name}
        </CardTitle>
        {event.description && (
          <CardDescription>{event.description}</CardDescription>
        )}
      </CardHeader>
      <CardContent>
        {calendarUser.name} is currently booked up. Please check back later or
        choose a shorter event.
      </CardContent>
      <CardFooter>
        <Button
          className="cursor-pointer hover:scale-105 bg-blue-400 hover:bg-blue-600"
          asChild
        >
          <Link href={`/book/${calendarUser.id}`}>Choose Another Event</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
