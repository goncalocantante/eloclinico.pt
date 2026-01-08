// This code defines a `SchedulePage` component that is responsible for rendering a user's schedule page. It first checks if the user is authenticated using Clerk's authentication system; if not, the user is redirected to the sign-in page. Then, it queries the database for the user's schedule, including any availability information associated with it. Once the schedule data is retrieved, it renders the page within a card layout, displaying a title and a `ScheduleForm` component populated with the user's schedule. This allows the user to view and possibly manage their schedule on the page.

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { ChangeWorkingHoursInput } from "@/calendar/components/change-working-hours-input";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Info } from "lucide-react";

// Default export function for the SchedulePage component
export default async function SchedulePage() {
  // Check if the user is authenticated
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session) {
    redirect("/sign-in");
  }

  return (
    <div className="flex flex-col w-full">
      <div className="flex justify-between items-center w-full mb-4">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold">Horários de Trabalho</h1>
          <Tooltip>
            <TooltipTrigger>
              <Info className="size-3" />
          </TooltipTrigger>
          <TooltipContent className="max-w-80 text-center">
            <p>
              Isto aplicará uma cor cinza às células do calendário que não coincidam
              dentro do horário de trabalho. Pode adicionar múltiplos intervalos de tempo por dia.
            </p>
          </TooltipContent>
        </Tooltip>
        </div>
      </div>
      <ChangeWorkingHoursInput />
    </div>
  );
}
