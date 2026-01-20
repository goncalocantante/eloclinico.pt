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
    <div className="max-w-md mx-auto p-4">
      <Card className="border shadow-sm">
        <CardHeader>
          <CardTitle>
            Book {event.name} with {calendarUser.name}
          </CardTitle>
          {event.description && (
            <CardDescription>{event.description}</CardDescription>
          )}
        </CardHeader>
        <CardContent className="text-muted-foreground">
          {calendarUser.name} is currently booked up. Please check back later or
          choose a shorter event.
        </CardContent>
        <CardFooter>
          <Button asChild>
            <Link href={`/book/${calendarUser.id}`}>Choose Another Event</Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
