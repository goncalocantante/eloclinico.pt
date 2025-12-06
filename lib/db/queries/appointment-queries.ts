import { getUser } from "./queries";
import { db } from "../drizzle";
import { appointments } from "@/lib/db/schema";
import type { TEventColor } from "@/calendar/types";

export async function getAppointments() {
  const user = await getUser();
  if (!user) {
    throw new Error("User not authenticated");
  }

  const rows = await db.select().from(appointments);
  const rowsMapped = rows.map((row) => {
    // Build start/end ISO strings using date + hour/minute from DB
    const startDate = new Date(row.startDate);
    startDate.setHours(row.startHour, row.startMinute, 0, 0);

    const endDate = new Date(row.endDate);
    endDate.setHours(row.endHour, row.endMinute, 0, 0);

    return {
      id: row.id,
      title: row.title,
      notes: row.notes ?? "", // default empty string
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      color: row.color as TEventColor,
      user: {
        id: row.userId,
        name: user.name, // you can fetch user info from users table if needed
      },
    };
  });

  return rowsMapped;
}
