"use server";

import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db/drizzle";

import { eventSchema } from "@/calendar/schemas";
import { appointments, patients, schedules } from "@/lib/db/schema";
import { getUser } from "@/lib/db/queries/queries";
import { getSchedule } from "@/server/actions/schedule";
import { getPublicEvents } from "@/server/actions/events";
import { createCalendarEvent, createSecondaryCalendar, deleteCalendarEvent } from "@/server/google/googleCalendar";

export const createAppointment = async (data: unknown) => {
  const user = await getUser();
  if (!user) {
    throw new Error("User is not authenticated");
  }

  const result = eventSchema.safeParse(data);
  if (!result.success) {
    console.log("Error parsing event schema: ", result);
    return { error: result.error.issues[0].message };
  }

  if (
    !result.data.startDate ||
    !result.data.startTime ||
    !result.data.endTime ||
    !result.data.patientId
  ) {
    return { error: "Missing required fields" };
  }

  // Get user's schedule and first active event
  const schedule = await getSchedule(user.id);
  if (!schedule) {
    throw new Error("User schedule not found");
  }

  const events = await getPublicEvents(user.id);
  if (events.length === 0) {
    throw new Error("No active events found for user");
  }
  const event = events.find((event) => event.id === result.data.appointmentType);
  if (!event || !event.id) {
    throw new Error("Event not found");
  }

  // Combine startDate and startTime into startDateTime
  const startDateTime = new Date(result.data.startDate);
  const endDate = result.data.startDate;
  const endDateTime = new Date(endDate);

  // Parse the "HH:mm" string from result.data.startTime
  const [startHours, startMinutes] = result.data.startTime.split(":").map(Number);
  const [endHours, endMinutes] = result.data.endTime.split(":").map(Number);
  startDateTime.setHours(startHours, startMinutes);
  endDateTime.setHours(endHours, endMinutes);

  const patient = await db.query.patients.findFirst({
    where: eq(patients.id, result.data.patientId),
  });

  if (!patient) {
    throw new Error("Patient not found");
  }

  // Handle Google Calendar Logic
  let googleCalendarId = schedule.googleCalendarId;

  if (!googleCalendarId) {
    // Create a secondary calendar for the app if it doesn't exist
    const newCalendar = await createSecondaryCalendar(user.id, "Elo App");
    googleCalendarId = newCalendar.id || "primary";

    // Update the schedule with the new calendar ID
    await db
      .update(schedules)
      .set({ googleCalendarId })
      .where(eq(schedules.id, schedule.id));
  }

  // create event in google calendar
  const googleEvent = await createCalendarEvent({
    userId: user.id,
    guestName: patient.name || "",
    guestEmail: patient.email || "",
    startTime: startDateTime,
    durationInMinutes: event.durationInMinutes || 0,
    eventName: result.data.title || "",
    calendarId: googleCalendarId,
  });

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
    googleEventId: googleEvent.id,
  };

  const res = await db.insert(appointments).values(dbData).returning();

  return res;
};

export const updateAppointment = async (id: string, data: unknown) => {
  const user = await getUser();
  if (!user) {
    throw new Error("User is not authenticated");
  }

  const result = eventSchema.safeParse(data);
  if (!result.success) {
    console.log("Error parsing event schema: ", result);
    return { error: result.error.issues[0].message };
  }

  if (
    !result.data.startDate ||
    !result.data.startTime ||
    !result.data.endTime ||
    !result.data.patientId
  ) {
    return { error: "Missing required fields" };
  }

  // Get user's schedule
  const schedule = await getSchedule(user.id);
  if (!schedule) {
    throw new Error("User schedule not found");
  }

  const events = await getPublicEvents(user.id);
  if (events.length === 0) {
    throw new Error("No active events found for user");
  }
  const eventId = events.find((event) => event.id === result.data.appointmentType)?.id;
  if (!eventId) {
    throw new Error("Event not found");
  }

  // Combine startDate and startTime into startDateTime
  const startDateTime = new Date(result.data.startDate);
  const endDate = result.data.startDate;
  const endDateTime = new Date(endDate);

  // Parse the "HH:mm" string from result.data.startTime
  const [startHours, startMinutes] = result.data.startTime.split(":").map(Number);
  const [endHours, endMinutes] = result.data.endTime.split(":").map(Number);
  startDateTime.setHours(startHours, startMinutes);
  endDateTime.setHours(endHours, endMinutes);

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
    eventId: eventId,
  };

  const res = await db
    .update(appointments)
    .set(dbData)
    .where(eq(appointments.id, id))
    .returning();

  return res;
};

export const deleteAppointment = async (id: string) => {
  const user = await getUser();
  if (!user) {
    throw new Error("User is not authenticated");
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

  // Delete from Google Calendar if linked
  if (appointment.googleEventId) {
    const schedule = await getSchedule(user.id);
    if (schedule && schedule.googleCalendarId) {
      await deleteCalendarEvent(
        user.id,
        schedule.googleCalendarId,
        appointment.googleEventId
      );
    }
  }

  // Delete the appointment
  await db.delete(appointments).where(eq(appointments.id, id));

  return { success: true };
};
