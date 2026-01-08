"use client";

import { createContext, useContext, useState, useEffect } from "react";
import useSWR from "swr";
import { pt } from "date-fns/locale";

import type { Dispatch, SetStateAction } from "react";
import type { Locale } from "date-fns";
import type { IEvent, IUser } from "@/calendar/interfaces";
import type {
  TBadgeVariant,
  TVisibleHours,
  TWorkingHours,
} from "@/calendar/types";
import { type Event } from "@/lib/db/schema";
import { authClient } from "@/lib/auth/client";
import { fetcher } from "@/lib/utils";
import { scheduleToWorkingHours } from "@/calendar/helpers";
import type { FullSchedule } from "@/server/actions/schedule";

interface IAddAppointmentDialogState {
  patientId?: string;
  startDate?: Date;
  startTime?: string;
  endTime?: string;
}

interface ICalendarContext {
  selectedDate: Date;
  setSelectedDate: (date: Date | undefined) => void;
  selectedUserId: IUser["id"] | "all";
  setSelectedUserId: (userId: IUser["id"] | "all") => void;
  badgeVariant: TBadgeVariant;
  setBadgeVariant: (variant: TBadgeVariant) => void;
  users: IUser[];
  workingHours: TWorkingHours;
  setWorkingHours: Dispatch<SetStateAction<TWorkingHours>>;
  visibleHours: TVisibleHours;
  setVisibleHours: Dispatch<SetStateAction<TVisibleHours>>;
  events: Event[];
  refetchEvents: () => Promise<Event[] | undefined>;
  appointments: IEvent[];
  refetchAppointments: () => Promise<IEvent[] | undefined>;
  locale: Locale;
  setLocale: (locale: Locale) => void;
  schedule: FullSchedule | null | undefined;
  refetchSchedule: () => Promise<FullSchedule | undefined>;
  // Add Appointment Dialog state
  isAddAppointmentDialogOpen: boolean;
  addAppointmentDialogState: IAddAppointmentDialogState;
  openAddAppointmentDialog: (state?: IAddAppointmentDialogState) => void;
  closeAddAppointmentDialog: () => void;
}

const CalendarContext = createContext({} as ICalendarContext);

const DEFAULT_WORKING_HOURS: TWorkingHours = [
  { dayOfWeek: "monday", startTime: "08:00", endTime: "17:00" },
  { dayOfWeek: "tuesday", startTime: "08:00", endTime: "17:00" },
  { dayOfWeek: "wednesday", startTime: "08:00", endTime: "17:00" },
  { dayOfWeek: "thursday", startTime: "08:00", endTime: "17:00" },
  { dayOfWeek: "friday", startTime: "08:00", endTime: "17:00" },
  { dayOfWeek: "saturday", startTime: "08:00", endTime: "12:00" },
];

const VISIBLE_HOURS = { from: 7, to: 18 };

export function CalendarProvider({
  children,
  users,
}: {
  children: React.ReactNode;
  users: IUser[];
}) {
  const [badgeVariant, setBadgeVariant] = useState<TBadgeVariant>("colored");
  const [visibleHours, setVisibleHours] =
    useState<TVisibleHours>(VISIBLE_HOURS);
  const [locale, setLocale] = useState<Locale>(pt);

  const {
    data: session,
    isPending, //loading state
    error, //error object
    refetch, //refetch the session
  } = authClient.useSession();

  // Fetch schedule from database
  const { data: schedule, mutate: refetchSchedule } = useSWR<FullSchedule>(
    session?.user?.id ? "/api/schedule" : null,
    fetcher
  );

  // Convert schedule to working hours format
  const dbWorkingHours = scheduleToWorkingHours(schedule);
  const [workingHours, setWorkingHours] = useState<TWorkingHours>(
    () => dbWorkingHours || DEFAULT_WORKING_HOURS
  );

  // Update working hours when schedule changes
  useEffect(() => {
    const converted = scheduleToWorkingHours(schedule);
    setWorkingHours(converted || DEFAULT_WORKING_HOURS);
  }, [schedule]);

  const [selectedDate, setSelectedDate] = useState(new Date());

  // Add Appointment Dialog state
  const [isAddAppointmentDialogOpen, setIsAddAppointmentDialogOpen] =
    useState(false);
  const [addAppointmentDialogState, setAddAppointmentDialogState] =
    useState<IAddAppointmentDialogState>({});

  const openAddAppointmentDialog = (state?: IAddAppointmentDialogState) => {
    setAddAppointmentDialogState(state || {});
    setIsAddAppointmentDialogOpen(true);
  };

  const closeAddAppointmentDialog = () => {
    setIsAddAppointmentDialogOpen(false);
    setAddAppointmentDialogState({});
  };

  const selectedUserId: IUser["id"] = session?.user?.id ?? "all";
  const setSelectedUserId = () => {};
  // const [selectedUserId, setSelectedUserId] = useState<IUser["id"] | "all">(
  //   "all"
  // );

  // Fetch appointments from the database using SWR
  const { data: appointments = [], mutate: refetchAppointments } = useSWR<
    IEvent[]
  >("/api/appointments", fetcher);

  // Fetch events from the database using SWR
  const { data: events = [], mutate: refetchEvents } = useSWR<Event[]>(
    "/api/events",
    fetcher
  );

  const handleSelectDate = (date: Date | undefined) => {
    if (!date) return;
    setSelectedDate(date);
  };

  return (
    <CalendarContext.Provider
      value={{
        selectedDate,
        setSelectedDate: handleSelectDate,
        selectedUserId,
        setSelectedUserId,
        badgeVariant,
        setBadgeVariant,
        users,
        visibleHours,
        setVisibleHours,
        workingHours,
        setWorkingHours,
        appointments: appointments,
        refetchAppointments,
        events: events,
        refetchEvents,
        locale,
        setLocale,
        schedule,
        refetchSchedule,
        isAddAppointmentDialogOpen,
        addAppointmentDialogState,
        openAddAppointmentDialog,
        closeAddAppointmentDialog,
      }}
    >
      {children}
    </CalendarContext.Provider>
  );
}

export function useCalendar(): ICalendarContext {
  const context = useContext(CalendarContext);
  if (!context)
    throw new Error("useCalendar must be used within a CalendarProvider.");
  return context;
}
