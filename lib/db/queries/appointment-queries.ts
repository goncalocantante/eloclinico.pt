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
    // Extract hour and minute from timestamps for frontend compatibility
    const startDate = new Date(row.startDateTime);
    const endDate = new Date(row.endDateTime);
    const startHour = startDate.getHours();
    const startMinute = startDate.getMinutes();
    const endHour = endDate.getHours();
    const endMinute = endDate.getMinutes();
    return {
      id: row.id,
      title: row.title,
      notes: row.notes ?? "", // default empty string
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      startHour,
      startMinute,
      endHour,
      endMinute,
      color: row.color as TEventColor,
      appointmentType: row.appointmentType,
      scheduleId: row.scheduleId,
      eventId: row.eventId,
      user: {
        id: row.userId,
        name: user.name, // you can fetch user info from users table if needed
      },
    };
  });

  return rowsMapped;
}
