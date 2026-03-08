import { getUser } from "./queries";
import { db } from "../drizzle";
import { appointments } from "@/lib/db/schema";
import type { TEventColor } from "@/calendar/types";
import { eq } from "drizzle-orm";

/**
 * Fetches minimal appointment data for the public video call page.
 * GDPR: Returns ONLY fields needed for the call — no patient PII, notes, or psychologist details.
 * No authentication required — patients access via shared link.
 */
export async function getAppointmentForVideoCall(appointmentId: string) {
  const [appointment] = await db
    .select({
      id: appointments.id,
      title: appointments.title,
      videoCallUrl: appointments.videoCallUrl,
      videoCallRoomName: appointments.videoCallRoomName,
      startDateTime: appointments.startDateTime,
      endDateTime: appointments.endDateTime,
    })
    .from(appointments)
    .where(eq(appointments.id, appointmentId))
    .limit(1);

  return appointment || null;
}

export async function getAppointments() {
  const user = await getUser();
  if (!user) {
    throw new Error("User not authenticated");
  }

  const rows = await db
    .select()
    .from(appointments)
    .where(eq(appointments.userId, user.id));
  const rowsMapped = rows.map((row) => {
    // Extract hour and minute from timestamps for frontend compatibility
    const startDate = new Date(row.startDateTime);
    const endDate = new Date(row.endDateTime);
    return {
      id: row.id,
      title: row.title,
      patientId: row.patientId,
      notes: row.notes ?? "", // default empty string
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
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
