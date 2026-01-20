"use client";

import { getPublicEvents, PublicEvent } from "@/server/actions/events";
import { useEffect, useState } from "react";
// import Loading from "./Loading";
import { Copy, Eye, Calendar, User as UserIcon } from "lucide-react";
import { Button } from "./ui/button";
import { toast } from "sonner";
import PublicEventCard from "./public-event-card";
import { User } from "@/lib/db/schema";
import { fetcher } from "@/lib/utils";
import useSWR from "swr";
import {
  Card,
  CardContent
} from "./ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

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
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-6 md:p-10 space-y-10">
      {/* Profile Header */}
      <div className="flex flex-col items-center justify-center space-y-4">
        {user?.id === userId && (
          <div className="w-full flex justify-center mb-2">
            <div className="bg-primary/10 text-primary px-4 py-2 rounded-full flex items-center gap-2 text-sm font-medium animate-in fade-in slide-in-from-top-4 duration-500">
              <Eye className="w-4 h-4" />
              <span>This is how people will see your public profile</span>
            </div>
          </div>
        )}

        <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 w-full max-w-2xl text-center space-y-6">
          <div className="flex justify-center">
            <Avatar className="h-24 w-24 border-4 border-gray-50 dark:border-gray-900 shadow-lg">
              <AvatarImage
                src={`https://api.dicebear.com/9.x/initials/svg?seed=${fullName}`}
              />
              <AvatarFallback className="text-2xl bg-primary/10 text-primary">
                {fullName
                  ?.split(" ")
                  .map((n) => n[0])
                  .join("")}
              </AvatarFallback>
            </Avatar>
          </div>

          <div className="space-y-2">
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-gray-900 dark:text-white">
              {fullName}
            </h1>
            <div className="flex items-center justify-center gap-2 text-muted-foreground">
              <UserIcon className="w-4 h-4" />
              <span>Psicólogo(a) / Terapeuta</span>
            </div>
          </div>

          <div className="pt-2">
            <p className="text-lg text-muted-foreground max-w-md mx-auto leading-relaxed">
              Bem-vindo(a) ao meu espaço de agendamento. Escolha um serviço
              abaixo para marcarmos a nossa conversa.
            </p>
          </div>

          {user?.id === userId && (
            <div className="pt-4 border-t border-gray-100 dark:border-gray-700">
              <Button
                variant="outline"
                onClick={copyProfileUrl}
                className="gap-2 rounded-full hover:bg-primary/5 hover:text-primary transition-colors hover:border-primary/20"
              >
                <Copy className="size-4" />
                Copiar Link do Perfil
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Events Grid */}
      <div className="space-y-6">
        <div className="flex items-center gap-3 text-xl font-semibold text-gray-900 dark:text-white">
          <Calendar className="w-6 h-6 text-primary" />
          <h2>Serviços Disponíveis</h2>
        </div>

        {events.length === 0 ? (
          <Card className="border-dashed border-2 bg-gray-50/50 dark:bg-gray-900/50">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground space-y-4">
              <Calendar className="w-12 h-12 text-gray-300 dark:text-gray-700" />
              <p>Nenhum serviço disponível para agendamento no momento.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {events.map((event) => (
              <PublicEventCard key={event.id} {...event} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
