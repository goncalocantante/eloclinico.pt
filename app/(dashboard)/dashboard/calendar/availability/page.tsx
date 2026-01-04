// This code defines a `SchedulePage` component that is responsible for rendering a user's schedule page. It first checks if the user is authenticated using Clerk's authentication system; if not, the user is redirected to the sign-in page. Then, it queries the database for the user's schedule, including any availability information associated with it. Once the schedule data is retrieved, it renders the page within a card layout, displaying a title and a `ScheduleForm` component populated with the user's schedule. This allows the user to view and possibly manage their schedule on the page.

import { ScheduleForm } from "@/components/forms/schedule-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getSchedule } from "@/server/actions/schedule";

import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

// Default export function for the SchedulePage component
export default async function SchedulePage() {
  // Check if the user is authenticated
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session) {
    redirect("/sign-in");
  }
  const userId = session?.user?.id;

  // Query the database to fetch the user's schedule based on the authenticated user
  const schedule = await getSchedule(userId);

  return (
    <Card className="max-w-md mx-auto border-8 border-blue-200 shadow-2xl shadow-accent-foreground">
      <CardHeader>
        <CardTitle>Schedule</CardTitle> {/* Display title for the page */}
      </CardHeader>
      <CardContent>
        <ScheduleForm schedule={schedule} />
        {/* Render the ScheduleForm component with the fetched schedule */}
      </CardContent>
    </Card>
  );
}
