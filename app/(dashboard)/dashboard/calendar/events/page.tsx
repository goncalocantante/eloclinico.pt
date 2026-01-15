import EventCard from "@/components/event-card";
import { Button } from "@/components/ui/button";
import { getEvents } from "@/server/actions/events";
import { CalendarRange, Plus } from "lucide-react";
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

  const events = await getEvents();

  return (
    <div className="flex flex-col w-full">
      <div className="flex justify-between items-center w-full mb-4">
        <h1 className="text-2xl font-bold">Events</h1>
        <Button asChild>
          <Link href="/dashboard/calendar/events/new">
            <Plus className="mr-2 size-4" /> Novo Evento
          </Link>
        </Button>
      </div>

      {/* Show event cards if any exist, otherwise show empty state */}
      {events.length > 0 ? (
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
          {events.map((event) => (
            <EventCard
              key={event.id}
              {...event}
              betterAuthUserId={session.user.id}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center gap-4 py-8">
          <CalendarRange className="size-16 mx-auto text-muted-foreground" />
          <p className="text-muted-foreground">
            Ainda não tem nenhum evento. Crie o seu primeiro evento para começar!
          </p>
          <Button asChild>
            <Link href="/dashboard/calendar/events/new">
              <Plus className="mr-2 size-4" /> Novo Evento
            </Link>
          </Button>
        </div>
      )}
    </div>
  );
}
