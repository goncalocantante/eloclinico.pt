"use client";

import { createContext, useContext, useState } from "react";
import useSWR from "swr";

import type { Dispatch, SetStateAction } from "react";
import type { IEvent, IUser } from "@/calendar/interfaces";
import type {
  TBadgeVariant,
  TVisibleHours,
  TWorkingHours,
} from "@/calendar/types";
import { Patient, type Event } from "@/lib/db/schema";
import { authClient } from "@/lib/auth/client";
import { fetcher } from "@/lib/utils";

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
  patients: Patient[];
  refetchPatients: () => Promise<Patient[] | undefined>;
}

const CalendarContext = createContext({} as ICalendarContext);

const WORKING_HOURS = {
  0: { from: 0, to: 0 },
  1: { from: 8, to: 17 },
  2: { from: 8, to: 17 },
  3: { from: 8, to: 17 },
  4: { from: 8, to: 17 },
  5: { from: 8, to: 17 },
  6: { from: 8, to: 12 },
};

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
  const [workingHours, setWorkingHours] =
    useState<TWorkingHours>(WORKING_HOURS);

  const [selectedDate, setSelectedDate] = useState(new Date());

  const {
    data: session,
    isPending, //loading state
    error, //error object
    refetch, //refetch the session
  } = authClient.useSession();

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

  // Fetch appointments from the database using SWR
  const { data: patients = [], mutate: refetchPatients } = useSWR<Patient[]>(
    "/api/patients",
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
        patients: patients,
        refetchPatients,
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
