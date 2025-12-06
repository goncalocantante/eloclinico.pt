import EventCard from "@/components/ui/event-card";
import { Button } from "@/components/ui/button";
import { getEvents } from "@/server/actions/events";
import { CalendarPlus, CalendarRange } from "lucide-react";
import Link from "next/link";

import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function EventsPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session) {
    redirect("/sign-in");
  }

  const events = await getEvents(session.user.id);

  return (
    <section className="flex flex-col items-center gap-16 animate-fade-in">
      {/* Page title and "New Event" button */}
      <div className="flex gap-4 items-baseline">
        <h1 className="text-4xl xl:text-5xl font-black mb-6">Events</h1>
        {/* 
                        Without asChild, the Button would render as:
                        <button><a href="/dashboard">Go to Dashboard</a></button> <!-- Invalid HTML -->
                        With asChild, it renders as:
                        <a href="/dashboard" class="...button styles...">Go to Dashboard</a> <!-- Valid HTML -->
                        This is useful when you want to make another element (like a <Link>) look and behave like a button without breaking HTML semantics.
                        */}
        <Button
          className="bg-blue-500 hover:bg-blue-400 text-white py-6 hover:scale-110 duration-500 border-b-4 border-blue-700 hover:border-blue-500 rounded-2xl shadow-accent-foreground text-2xl font-black"
          asChild
        >
          <Link href="/dashboard/events/new">
            <CalendarPlus className="mr-4 size-7" /> Book Appointment
          </Link>
        </Button>
      </div>

      {/* Show event cards if any exist, otherwise show empty state */}
      {events.length > 0 ? (
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4 p-10">
          {events.map((event: any) => (
            <EventCard key={event.id} {...event} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center gap-4">
          <CalendarRange className="size-16 mx-auto text-black" />
          You do not have any events yet. Create your first event to get
          started!
          <Button
            className="bg-blue-500 hover:bg-blue-400 text-white py-6 hover:scale-110 duration-500 border-b-4 border-blue-700 hover:border-blue-500 rounded-2xl shadow-accent-foreground shadow-2xl text-2xl font-black"
            asChild
          >
            <Link href="/dashboard/events/new">
              <CalendarPlus className="mr-4 size-7" /> New Event
            </Link>
          </Button>
        </div>
      )}
    </section>
  );
}
