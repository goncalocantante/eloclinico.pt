import { formatEventDescription } from "@/lib/formatters";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./ui/card";
import Link from "next/link";
import { Button } from "./ui/button";

// Type definition for event card props
type PublicEventCardProps = {
  id: string;
  name: string;
  userId: string;
  description: string | null;
  durationInMinutes: number;
};

// Component to display a single event card
export default function PublicEventCard({
  id,
  name,
  description,
  userId,
  durationInMinutes,
}: PublicEventCardProps) {
  return (
    <Card className="flex flex-col">
      <CardHeader>
        {/* Card title and description */}
        <CardTitle>{name}</CardTitle>
        <CardDescription>
          {formatEventDescription(durationInMinutes)}{" "}
          {/* Format and display event duration */}
        </CardDescription>
      </CardHeader>
      {/* Render event description if available */}
      {description && <CardContent>{description}</CardContent>}
      <CardFooter className="flex justify-end gap-2 mt-auto">
        {/* Select button that links to the booking page for the specific event */}
        <Button asChild>
          <Link href={`/book/${userId}/${id}`}>Selecionar</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
