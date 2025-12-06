"use client";

import { getPublicEvents, PublicEvent } from "@/server/actions/events";
import { useEffect, useState } from "react";
// import Loading from "./Loading";
import { Copy, Eye } from "lucide-react";
import { Button } from "./ui/button";
import { toast } from "sonner";
import PublicEventCard from "./public-event-card";
import { User } from "@/lib/db/schema";
import { fetcher } from "@/lib/utils";
import useSWR from "swr";

// Define types for the props that PublicProfile component will receive
type PublicProfileProps = {
  userId: string; // The user ID for the profile
  fullName: string | null; // User's full name
};

export default function PublicProfile({
  userId,
  fullName,
}: PublicProfileProps) {
  // State to store events and loading state
  const [events, setEvents] = useState<PublicEvent[] | null>(null);
  const { data: user } = useSWR<User>("/api/user", fetcher);

  const copyProfileUrl = async () => {
    try {
      await navigator.clipboard.writeText(
        `${window.location.origin}/book/${userId}`
      );
      toast("Profile URL copied to clipboard!");
    } catch (error) {
      console.error("Failed to copy URL:", error);
    }
  };

  // Fetch events when the component mounts
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const fetchedEvents = await getPublicEvents(userId); // Call the action to get public events
        setEvents(fetchedEvents); // Set the events state
      } catch (error) {
        console.error("Error fetching events:", error);
        setEvents([]); // Optionally, set an empty array in case of an error
      }
    };

    fetchEvents(); // Fetch events on component mount
  }, [userId]); // Only refetch events when userId changes

  // Render loading component if events are not yet fetched
  if (events === null) {
    return (
      <div className="max-w-5xl mx-auto text-center">
        {/* <Loading /> */}
        <div>Loading...</div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-5">
      {user?.id === userId && (
        // Info message with Eye icon (for profile owner only)
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4 font-bold">
          <Eye className="w-4 h-4" />
          <p>This is how people will see your public profile</p>
        </div>
      )}

      {/* Display user's name */}
      <div className="text-4xl md:text-5xl font-black mb-4 text-center">
        {fullName}
      </div>

      {/* Copy Public Profile URL Button */}
      {user?.id === userId && (
        <div className="flex justify-center mb-6">
          <Button
            className="cursor-pointer"
            variant={"outline"}
            onClick={copyProfileUrl}
          >
            <Copy className="size-4" />
            Copy Public Profile URL
          </Button>
        </div>
      )}

      {/* Welcome message */}
      <div className="text-muted-foreground mb-6 max-w-sm mx-auto text-center">
        <p className="font-bold text-2xl">Time to meet!🧑‍🤝‍🧑</p>
        <br /> Pick an event and let’s make it official by booking a time.
      </div>

      {/* Grid of public event cards */}
      {events.length === 0 ? (
        <div className="text-center text-muted-foreground">
          No events available at the moment.
        </div>
      ) : (
        <div className="grid gap-4 grid-cols-[repeat(auto-fill,minmax(300px,1fr))]">
          {events.map((event) => (
            // Render a card for each event
            <PublicEventCard key={event.id} {...event} />
          ))}
        </div>
      )}
    </div>
  );
}
