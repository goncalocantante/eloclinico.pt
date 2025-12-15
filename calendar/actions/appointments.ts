"use server";

import { eq } from "drizzle-orm";
import { db } from "@/lib/db/drizzle";

import { eventSchema } from "@/calendar/schemas";
import { appointments, patients } from "@/lib/db/schema";
import { getUser } from "@/lib/db/queries/queries";
import { getSchedule } from "@/server/actions/schedule";
import { getPublicEvents } from "@/server/actions/events";
import { createCalendarEvent } from "@/server/google/googleCalendar";

export const createAppointment = async (data: any) => {
  const user = await getUser();
  if (!user) {
    throw new Error("User is not authenticated");
  }

  const result = eventSchema.safeParse(data);
  if (!result.success) {
    console.log("Error parsing event schema: ", result);
    return { error: result.error.issues[0].message };
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
  const event = events.find((event) => event.id === data.appointmentType);
  if (!event || !event.id) {
    throw new Error("Event not found");
  }

  // Combine startDate and startTime into startDateTime
  const startDateTime = new Date(data.startDate);
  const endDate = data.startDate;
  const endDateTime = new Date(endDate);

  // Parse the "HH:mm" string from data.startTime
  const [startHours, startMinutes] = data.startTime.split(":").map(Number);
  const [endHours, endMinutes] = data.endTime.split(":").map(Number);
  startDateTime.setHours(startHours, startMinutes);
  endDateTime.setHours(endHours, endMinutes);

  const dbData = {
    userId: user.id,
    patientId: data.patientId,
    title: data.title || null,
    appointmentType: data.appointmentType,
    startDateTime: startDateTime,
    endDateTime: endDateTime,
    notes: data.notes || null,
    color: data.color,
    scheduleId: schedule.id,
    eventId: event.id,
  };

  const res = await db.insert(appointments).values(dbData).returning();

  const patient = await db.query.patients.findFirst({
    where: eq(patients.id, data.patientId),
  });

  if (!patient) {
    throw new Error("Patient not found");
  }

  // create event in google calendar
  await createCalendarEvent({
    userId: user.id,
    guestName: patient.name || "",
    guestEmail: patient.email || "",
    startTime: startDateTime,
    durationInMinutes: event.durationInMinutes || 0,
    eventName: data.title || "",
  });
  return res;
};

export const updateAppointment = async (id: string, data: any) => {
  const user = await getUser();
  if (!user) {
    throw new Error("User is not authenticated");
  }

  const result = eventSchema.safeParse(data);
  if (!result.success) {
    console.log("Error parsing event schema: ", result);
    return { error: result.error.issues[0].message };
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
  const eventId = events.find((event) => event.id === data.appointmentType)?.id;
  if (!eventId) {
    throw new Error("Event not found");
  }

  // Combine startDate and startTime into startDateTime
  const startDateTime = new Date(data.startDate);
  const endDate = data.startDate;
  const endDateTime = new Date(endDate);

  // Parse the "HH:mm" string from data.startTime
  const [startHours, startMinutes] = data.startTime.split(":").map(Number);
  const [endHours, endMinutes] = data.endTime.split(":").map(Number);
  startDateTime.setHours(startHours, startMinutes);
  endDateTime.setHours(endHours, endMinutes);

  const dbData = {
    userId: user.id,
    patientId: data.patientId,
    title: data.title || null,
    appointmentType: data.appointmentType,
    startDateTime: startDateTime,
    endDateTime: endDateTime,
    notes: data.notes || null,
    color: data.color,
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
