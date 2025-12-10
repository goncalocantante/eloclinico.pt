import type { TEventColor } from "@/calendar/types";

export interface IUser {
  id: string;
  name: string;
  picturePath: string | null;
}

export interface IEvent {
  id: number;
  patientId: string;
  startDate: string;
  endDate: string;
  title: string;
  color: TEventColor;
  user: IUser;
  appointmentType: string;
  notes: string;
  scheduleId: string;
  eventId: string;
}

export interface ICalendarCell {
  day: number;
  currentMonth: boolean;
  date: Date;
}
