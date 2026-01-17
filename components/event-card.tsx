import { cn } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./ui/card";
// import { formatEventDescription } from "@/lib/formatters";
import { Button } from "./ui/button";
import Link from "next/link";
// import { CopyEventButton } from "../CopyEventButton";

// Type definition for event card props
type EventCardProps = {
  id: string;
  isActive: boolean;
  name: string;
  description: string | null;
  durationInMinutes: number;
  betterAuthUserId?: string;
};

// Component to display a single event card
export default function EventCard({
  id,
  isActive,
  name,
  description,
  durationInMinutes,
}: EventCardProps) {
  return (
    <Card
      className={cn("flex flex-col", !isActive && "border-secondary/50")}
    >
      {/* Card header with title and formatted duration */}
      <CardHeader className={cn(!isActive && "opacity-50")}>
        <CardTitle>{name}</CardTitle>
        <CardDescription>
          {durationInMinutes} Minutos
          {/* {formatEventDescription(durationInMinutes)} */}
        </CardDescription>
      </CardHeader>

      {/* Show event description if available */}
      {description != null && (
        <CardContent className={cn(!isActive && "opacity-50")}>
          {description}
        </CardContent>
      )}

      {/* Card footer with copy and edit buttons */}
      <CardFooter className="flex justify-end gap-2 mt-auto">
        {/* Show copy button only if event is active */}
        {/* {isActive && (
          <CopyEventButton
            variant="outline"
            eventId={id}
            clerkUserId={clerkUserId}
          />
        )} */}
        {/* Edit event button */}
        <Button asChild>
          <Link href={`/dashboard/calendar/events/${id}/edit`}>Editar</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
