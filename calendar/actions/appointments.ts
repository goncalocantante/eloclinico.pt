"use server";

import { and, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db/drizzle";
import { differenceInMinutes } from "date-fns";

import { eventSchema } from "@/calendar/schemas";
import { appointments, patients, schedules } from "@/lib/db/schema";
import { getUser } from "@/lib/db/queries/queries";
import { getSchedule } from "@/server/actions/schedule";
import { isTimeWithinAvailability } from "@/calendar/helpers";
import { getPublicEvents } from "@/server/actions/events";
import {
  createCalendarEvent,
  createSecondaryCalendar,
  deleteCalendarEvent,
  updateCalendarEvent,
} from "@/server/google/googleCalendar";
import { createDailyRoom, deleteDailyRoom } from "@/server/video/daily";

/**
 * Sanitize a string into a valid Daily.co room name.
 * Removes special chars, lowercases, truncates, and appends a short random suffix.
 */
function sanitizeRoomName(title: string): string {
  const sanitized = title
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);
  const suffix = Math.random().toString(36).slice(2, 8);
  return `${sanitized || "session"}-${suffix}`;
}

function hasErrorCode(error: unknown): error is { code: string } {
  return error instanceof Object && 'code' in error;
}

export const createAppointment = async (data: unknown) => {
  const user = await getUser();
  if (!user) {
    return { success: false, error: "User is not authenticated" };
  }

  const result = eventSchema.safeParse(data);
  if (!result.success) {
    console.log("Error parsing event schema: ", result);
    return { success: false, error: result.error.issues[0].message };
  }

  // Build start and end DateTimes immutably
  const [startHours, startMinutes] = result.data.startTime.split(":").map(Number);
  const [endHours, endMinutes] = result.data.endTime.split(":").map(Number);

  const startDateTime = new Date(result.data.startDate);
  startDateTime.setHours(startHours, startMinutes, 0, 0);

  const endDateTime = new Date(result.data.startDate);
  endDateTime.setHours(endHours, endMinutes, 0, 0);

  // Fix #5: Validate endTime > startTime
  if (endDateTime <= startDateTime) {
    return { success: false, error: "Data de fim deve ser posterior à data de início." };
  }

  // Fix #7: No past-date appointments
  if (startDateTime < new Date()) {
    return { success: false, error: "Não é possível criar um compromisso no passado." };
  }

  // Get user's schedule
  const schedule = await getSchedule(user.id);
  if (!schedule) {
    return { success: false, error: "User schedule not found." };
  }

  // Get event type
  const events = await getPublicEvents(user.id);
  if (events.length === 0) {
    return { success: false, error: "Nenhum tipo de consulta ativo encontrado. Por favor, crie um primeiro." };
  }

  const event = events.find((e) => e.id === result.data.appointmentType);
  if (!event || !event.id) {
    return { success: false, error: "Tipo de consulta selecionado não encontrado." };
  }

  // Fix #4: Verify patient belongs to the current user
  const patient = await db.query.patients.findFirst({
    where: and(eq(patients.id, result.data.patientId), eq(patients.userId, user.id)),
  });

  if (!patient) {
    return { success: false, error: "Paciente não encontrado." };
  }

  // Check if the time slot falls within the user's availability
  if (!isTimeWithinAvailability(schedule, startDateTime, endDateTime)) {
    return { success: false, error: "Este horário está fora do seu horário de funcionamento." };
  }

  // Check for overlaps
  const overlap = await db.query.appointments.findFirst({
    where: and(
      eq(appointments.userId, user.id),
      sql`tstzrange(${appointments.startDateTime}, ${appointments.endDateTime}, '[]') && tstzrange(${startDateTime.toISOString()}::timestamptz, ${endDateTime.toISOString()}::timestamptz, '[]')`
    ),
  });

  if (overlap) {
    return { success: false, error: "Outro compromisso coincide com este horário." };
  }

  // Fix #6: Use a single source of truth for duration
  const durationInMinutes = differenceInMinutes(endDateTime, startDateTime);

  // --- Video call room creation (best-effort) ---
  let videoCallUrl: string | null = null;
  let videoCallRoomName: string | null = null;
  let isVideoCall = false;

  if (result.data.isVideoCall) {
    const roomName = sanitizeRoomName(result.data.title || "consulta");
    const room = await createDailyRoom({ roomName, expiryMinutes: durationInMinutes });

    if (room) {
      videoCallUrl = room.url;
      videoCallRoomName = room.name;
      isVideoCall = true;
    } else {
      console.error("Failed to create video call room — proceeding without video call.");
    }
  }

  // --- All checks passed — insert into DB first ---
  const dbData = {
    userId: user.id,
    patientId: result.data.patientId,
    title: result.data.title || null,
    appointmentType: result.data.appointmentType,
    startDateTime: startDateTime,
    endDateTime: endDateTime,
    notes: result.data.notes || null,
    color: result.data.color || "blue",
    scheduleId: schedule.id,
    eventId: event.id,
    isVideoCall,
    videoCallUrl,
    videoCallRoomName,
  };

  try {
    const [created] = await db.insert(appointments).values(dbData).returning();

    // Best-effort Google Calendar sync after successful DB insert
    let googleCalendarId = schedule.googleCalendarId;

    if (!googleCalendarId) {
      const newCalendar = await createSecondaryCalendar(user.id, "Elo Clínico");

      if (newCalendar && newCalendar.id) {
        googleCalendarId = newCalendar.id;

        await db
          .update(schedules)
          .set({ googleCalendarId })
          .where(eq(schedules.id, schedule.id));
      }
    }

    if (googleCalendarId) {
      try {
        const googleEvent = await createCalendarEvent({
          userId: user.id,
          guestName: patient.name || "",
          guestEmail: patient.email || "",
          startTime: startDateTime,
          durationInMinutes,
          eventName: result.data.title || "",
          calendarId: googleCalendarId,
        });

        if (googleEvent?.id) {
          await db
            .update(appointments)
            .set({ googleEventId: googleEvent.id })
            .where(eq(appointments.id, created.id));
        }
      } catch (e) {
        console.error("Failed to sync with Google Calendar:", e);
        // Don't fail the appointment creation if Google Calendar sync fails
      }
    }

    return { success: true, data: created };
  } catch (error: unknown) {
    if (hasErrorCode(error) && error.code === "23505") {
      return { success: false, error: "Já existe uma consulta neste horário." };
    }
    console.error("Failed to create appointment:", error);
    return { success: false, error: "Falha ao criar consulta." };
  }
};

/**
 * Shared validation for updating/rescheduling an appointment's time.
 * Checks: time ordering, past-date, ownership, schedule, availability, overlap.
 */
async function validateAppointmentReschedule(
  userId: string,
  appointmentId: string,
  startDateTime: Date,
  endDateTime: Date
) {
  if (endDateTime <= startDateTime) {
    return { success: false as const, error: "Data de fim deve ser posterior à data de início." };
  }

  if (startDateTime < new Date()) {
    return { success: false as const, error: "Não é possível agendar uma consulta no passado." };
  }

  const existingAppointment = await db.query.appointments.findFirst({
    where: and(eq(appointments.id, appointmentId), eq(appointments.userId, userId)),
  });

  if (!existingAppointment) {
    return { success: false as const, error: "Consulta não encontrada ou sem permissão para editar." };
  }

  const schedule = await getSchedule(userId);
  if (!schedule) {
    return { success: false as const, error: "Horário do utilizador não encontrado." };
  }

  if (!isTimeWithinAvailability(schedule, startDateTime, endDateTime)) {
    return { success: false as const, error: "Este horário está fora do seu horário de funcionamento." };
  }

  const overlap = await db.query.appointments.findFirst({
    where: and(
      eq(appointments.userId, userId),
      sql`tstzrange(${appointments.startDateTime}, ${appointments.endDateTime}, '[]') && tstzrange(${startDateTime.toISOString()}::timestamptz, ${endDateTime.toISOString()}::timestamptz, '[]')`,
      sql`${appointments.id} != ${appointmentId}`
    ),
  });

  if (overlap) {
    return { success: false as const, error: "Outro compromisso coincide com este horário." };
  }

  const patient = await db.query.patients.findFirst({
    where: and(eq(patients.id, existingAppointment.patientId), eq(patients.userId, userId)),
  });

  return {
    success: true as const,
    existingAppointment,
    schedule,
    patient,
  };
}

export const updateAppointment = async (id: string, data: unknown) => {
  const user = await getUser();
  if (!user) {
    return { success: false, error: "Utilizador não autenticado" };
  }

  const result = eventSchema.safeParse(data);
  if (!result.success) {
    return { success: false, error: result.error.issues[0].message };
  }

  // Build start and end DateTimes
  const [startHours, startMinutes] = result.data.startTime.split(":").map(Number);
  const [endHours, endMinutes] = result.data.endTime.split(":").map(Number);

  const startDateTime = new Date(result.data.startDate);
  startDateTime.setHours(startHours, startMinutes, 0, 0);

  const endDateTime = new Date(result.data.startDate);
  endDateTime.setHours(endHours, endMinutes, 0, 0);

  // Shared validation: time ordering, past-date, ownership, availability, overlap
  const validation = await validateAppointmentReschedule(user.id, id, startDateTime, endDateTime);
  if (!validation.success) {
    return { success: false, error: validation.error };
  }

  const { existingAppointment, schedule, patient } = validation;

  // Get event type
  const events = await getPublicEvents(user.id);
  if (events.length === 0) {
    return { success: false, error: "Nenhum tipo de consulta ativo encontrado. Por favor, crie um primeiro." };
  }

  const event = events.find((e) => e.id === result.data.appointmentType);
  if (!event || !event.id) {
    return { success: false, error: "Tipo de consulta selecionado não encontrado." };
  }

  // Verify patient belongs to the current user (may differ from existing if changed)
  const updatedPatient = result.data.patientId !== existingAppointment.patientId
    ? await db.query.patients.findFirst({
        where: and(eq(patients.id, result.data.patientId), eq(patients.userId, user.id)),
      })
    : patient;

  if (!updatedPatient) {
    return { success: false, error: "Paciente não encontrado." };
  }

  const durationInMinutes = differenceInMinutes(endDateTime, startDateTime);

  // --- Video call state transitions ---
  const wasVideoCall = existingAppointment.isVideoCall;
  const wantsVideoCall = result.data.isVideoCall ?? false;
  const timeChanged =
    existingAppointment.startDateTime.getTime() !== startDateTime.getTime() ||
    existingAppointment.endDateTime.getTime() !== endDateTime.getTime();

  let videoCallUrl: string | null = existingAppointment.videoCallUrl;
  let videoCallRoomName: string | null = existingAppointment.videoCallRoomName;
  let isVideoCall = wasVideoCall;

  if (wasVideoCall && !wantsVideoCall) {
    // Video call disabled — GDPR: delete room and all data
    if (existingAppointment.videoCallRoomName) {
      const deleteResult = await deleteDailyRoom(existingAppointment.videoCallRoomName);
      if (!deleteResult.success) {
        console.error("Failed to delete Daily.co room:", deleteResult.error);
      }
    }
    videoCallUrl = null;
    videoCallRoomName = null;
    isVideoCall = false;
  } else if (!wasVideoCall && wantsVideoCall) {
    // Video call newly enabled — create room
    const roomName = sanitizeRoomName(result.data.title || "consulta");
    const room = await createDailyRoom({ roomName, expiryMinutes: durationInMinutes });
    if (room) {
      videoCallUrl = room.url;
      videoCallRoomName = room.name;
      isVideoCall = true;
    } else {
      console.error("Failed to create video call room — proceeding without video call.");
      videoCallUrl = null;
      videoCallRoomName = null;
      isVideoCall = false;
    }
  } else if (wasVideoCall && wantsVideoCall && timeChanged) {
    // Time changed with active video call — delete old room, create new one
    if (existingAppointment.videoCallRoomName) {
      const deleteResult = await deleteDailyRoom(existingAppointment.videoCallRoomName);
      if (!deleteResult.success) {
        console.error("Failed to delete old Daily.co room:", deleteResult.error);
      }
    }
    const roomName = sanitizeRoomName(result.data.title || "consulta");
    const room = await createDailyRoom({ roomName, expiryMinutes: durationInMinutes });
    if (room) {
      videoCallUrl = room.url;
      videoCallRoomName = room.name;
      isVideoCall = true;
    } else {
      console.error("Failed to create new video call room — removing video call.");
      videoCallUrl = null;
      videoCallRoomName = null;
      isVideoCall = false;
    }
  }

  const dbData = {
    userId: user.id,
    patientId: result.data.patientId,
    title: result.data.title || null,
    appointmentType: result.data.appointmentType,
    startDateTime: startDateTime,
    endDateTime: endDateTime,
    notes: result.data.notes || null,
    color: result.data.color || "blue",
    scheduleId: schedule.id,
    eventId: event.id,
    isVideoCall,
    videoCallUrl,
    videoCallRoomName,
  };

  try {
    const res = await db
      .update(appointments)
      .set(dbData)
      .where(and(eq(appointments.id, id), eq(appointments.userId, user.id)))
      .returning();

    if (res.length === 0) {
      return { success: false, error: "Consulta não encontrada ou atualização não permitida." };
    }

    // Sync Google Calendar after successful DB update
    if (existingAppointment.googleEventId && schedule.googleCalendarId) {
      try {
        await updateCalendarEvent({
          userId: user.id,
          eventId: existingAppointment.googleEventId,
          guestName: updatedPatient.name || "",
          guestEmail: updatedPatient.email || "",
          startTime: startDateTime,
          durationInMinutes,
          eventName: result.data.title || "",
          calendarId: schedule.googleCalendarId,
        });
      } catch (e) {
        console.error("Failed to update Google Calendar event:", e);
      }
    }

    return { success: true, data: res[0] };
  } catch (error: unknown) {
    if (hasErrorCode(error) && error.code === "23505") {
      return { success: false, error: "Já existe uma consulta neste horário." };
    }
    console.error("Failed to update appointment:", error);
    return { success: false, error: "Falha ao atualizar consulta." };
  }
};

export const rescheduleAppointment = async (
  id: string,
  newStartDateTime: string,
  newEndDateTime: string
) => {
  const user = await getUser();
  if (!user) {
    return { success: false, error: "Utilizador não autenticado" };
  }

  const startDateTime = new Date(newStartDateTime);
  const endDateTime = new Date(newEndDateTime);

  if (isNaN(startDateTime.getTime()) || isNaN(endDateTime.getTime())) {
    return { success: false, error: "Datas inválidas." };
  }

  // Shared validation: time ordering, past-date, ownership, availability, overlap
  const validation = await validateAppointmentReschedule(user.id, id, startDateTime, endDateTime);
  if (!validation.success) {
    return { success: false, error: validation.error };
  }

  const { existingAppointment, schedule, patient } = validation;
  const durationInMinutes = differenceInMinutes(endDateTime, startDateTime);

  // --- Recreate video call room if appointment had one ---
  let videoCallUrl: string | null = existingAppointment.videoCallUrl;
  let videoCallRoomName: string | null = existingAppointment.videoCallRoomName;
  let isVideoCall = existingAppointment.isVideoCall;

  if (existingAppointment.isVideoCall && existingAppointment.videoCallRoomName) {
    // Delete old room
    const deleteResult = await deleteDailyRoom(existingAppointment.videoCallRoomName);
    if (!deleteResult.success) {
      console.error("Failed to delete old Daily.co room:", deleteResult.error);
    }

    // Create new room with updated expiry
    const roomName = sanitizeRoomName(existingAppointment.title || "consulta");
    const room = await createDailyRoom({ roomName, expiryMinutes: durationInMinutes });
    if (room) {
      videoCallUrl = room.url;
      videoCallRoomName = room.name;
    } else {
      console.error("Failed to create new video call room — removing video call.");
      videoCallUrl = null;
      videoCallRoomName = null;
      isVideoCall = false;
    }
  }

  try {
    const res = await db
      .update(appointments)
      .set({ startDateTime, endDateTime, videoCallUrl, videoCallRoomName, isVideoCall })
      .where(and(eq(appointments.id, id), eq(appointments.userId, user.id)))
      .returning();

    if (res.length === 0) {
      return { success: false, error: "Consulta não encontrada ou atualização não permitida." };
    }

    // Sync Google Calendar after successful DB update
    if (existingAppointment.googleEventId && schedule.googleCalendarId) {
      try {
        await updateCalendarEvent({
          userId: user.id,
          eventId: existingAppointment.googleEventId,
          guestName: patient?.name || "",
          guestEmail: patient?.email || "",
          startTime: startDateTime,
          durationInMinutes,
          eventName: existingAppointment.title || "",
          calendarId: schedule.googleCalendarId,
        });
      } catch (e) {
        console.error("Failed to update Google Calendar event:", e);
      }
    }

    return { success: true, data: res[0] };
  } catch (error: unknown) {
    if (hasErrorCode(error) && error.code === "23505") {
      return { success: false, error: "Já existe uma consulta neste horário." };
    }
    console.error("Failed to reschedule appointment:", error);
    return { success: false, error: "Falha ao reagendar consulta." };
  }
};

export const deleteAppointment = async (id: string) => {
  const user = await getUser();
  if (!user) {
    return { success: false, error: "User is not authenticated" };
  }

  // Check if appointment exists and belongs to the authenticated user
  const [appointment] = await db
    .select()
    .from(appointments)
    .where(and(eq(appointments.id, id), eq(appointments.userId, user.id)))
    .limit(1);

  if (!appointment) {
    return {
      success: false,
      error: "Appointment not found or you don't have permission to delete it.",
    };
  }

  try {
    // GDPR: Delete Daily.co room BEFORE deleting DB row — right to erasure
    if (appointment.videoCallRoomName) {
      const deleteResult = await deleteDailyRoom(appointment.videoCallRoomName);
      if (!deleteResult.success) {
        console.error("Failed to delete Daily.co room:", deleteResult.error);
        // Continue to delete appointment from DB
      }
    }

    // Delete from Google Calendar if linked
    if (appointment.googleEventId) {
      const schedule = await getSchedule(user.id);
      if (schedule && schedule.googleCalendarId) {
        // Best effort delete from Google Calendar
        try {
          await deleteCalendarEvent(
            user.id,
            schedule.googleCalendarId,
            appointment.googleEventId
          );
        } catch (e) {
          console.error("Failed to delete from Google Calendar", e);
          // Continue to delete from DB
        }
      }
    }

    // Delete the appointment
    await db.delete(appointments).where(eq(appointments.id, id));

    return { success: true };
  } catch (error) {
    console.error("Failed to delete appointment:", error);
    return { success: false, error: "Failed to delete appointment" };
  }
};
