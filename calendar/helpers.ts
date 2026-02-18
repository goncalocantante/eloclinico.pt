import { fromZonedTime } from "date-fns-tz";
import {
  addDays,
  addMonths,
  addWeeks,
  subDays,
  subMonths,
  subWeeks,
  isSameWeek,
  isSameDay,
  isSameMonth,
  startOfWeek,
  startOfMonth,
  endOfMonth,
  endOfWeek,
  format,
  parseISO,
  differenceInMinutes,
  eachDayOfInterval,
  startOfDay,
  differenceInDays,
  endOfYear,
  startOfYear,
  subYears,
  addYears,
  isSameYear,
  isFriday,
  isMonday,
  isSaturday,
  isSunday,
  isThursday,
  isTuesday,
  isWednesday,
  isWithinInterval,
  setHours,
  setMinutes,
} from "date-fns";
import type { Locale } from "date-fns";

import type { ICalendarCell, IEvent } from "@/calendar/interfaces";
import type {
  TCalendarView,
  TVisibleHours,
  TWorkingHours,
} from "@/calendar/types";
import { DAYS_OF_WEEK_IN_ORDER } from "@/constants";
import { scheduleAvailability } from "@/lib/db/schema";
import type { FullSchedule } from "@/server/actions/schedule";

// ================ Header helper functions ================ //

export function rangeText(view: TCalendarView, date: Date, locale?: Locale) {
  const formatString = "MMM d, yyyy";
  let start: Date;
  let end: Date;

  switch (view) {
    case "agenda":
      start = startOfMonth(date);
      end = endOfMonth(date);
      break;
    case "year":
      start = startOfYear(date);
      end = endOfYear(date);
      break;
    case "month":
      start = startOfMonth(date);
      end = endOfMonth(date);
      break;
    case "week":
      start = startOfWeek(date);
      end = endOfWeek(date);
      break;
    case "day":
      return format(date, formatString, locale ? { locale } : undefined);
    default:
      return "Error while formatting ";
  }

  return `${format(
    start,
    formatString,
    locale ? { locale } : undefined
  )} - ${format(end, formatString, locale ? { locale } : undefined)}`;
}

export function navigateDate(
  date: Date,
  view: TCalendarView,
  direction: "previous" | "next"
): Date {
  const operations = {
    agenda: direction === "next" ? addMonths : subMonths,
    year: direction === "next" ? addYears : subYears,
    month: direction === "next" ? addMonths : subMonths,
    week: direction === "next" ? addWeeks : subWeeks,
    day: direction === "next" ? addDays : subDays,
  };

  return operations[view](date, 1);
}

export function getEventsCount(
  events: IEvent[],
  date: Date,
  view: TCalendarView
): number {
  const compareFns = {
    agenda: isSameMonth,
    year: isSameYear,
    day: isSameDay,
    week: isSameWeek,
    month: isSameMonth,
  };

  return events.filter((event) =>
    compareFns[view](new Date(event.startDate), date)
  ).length;
}

// ================ Week and day view helper functions ================ //

export function getCurrentEvents(events: IEvent[]) {
  const now = new Date();
  return (
    events.filter((event) =>
      isWithinInterval(now, {
        start: parseISO(event.startDate),
        end: parseISO(event.endDate),
      })
    ) || null
  );
}

export function groupEvents(dayEvents: IEvent[]) {
  const sortedEvents = dayEvents.sort(
    (a, b) => parseISO(a.startDate).getTime() - parseISO(b.startDate).getTime()
  );
  const groups: IEvent[][] = [];

  for (const event of sortedEvents) {
    const eventStart = parseISO(event.startDate);

    let placed = false;
    for (const group of groups) {
      const lastEventInGroup = group[group.length - 1];
      const lastEventEnd = parseISO(lastEventInGroup.endDate);

      if (eventStart >= lastEventEnd) {
        group.push(event);
        placed = true;
        break;
      }
    }

    if (!placed) groups.push([event]);
  }

  return groups;
}

export function getEventBlockStyle(
  event: IEvent,
  day: Date,
  groupIndex: number,
  groupSize: number,
  visibleHoursRange?: { from: number; to: number }
) {
  const startDate = parseISO(event.startDate);
  const dayStart = new Date(day.setHours(0, 0, 0, 0));
  const eventStart = startDate < dayStart ? dayStart : startDate;
  const startMinutes = differenceInMinutes(eventStart, dayStart);

  let top;

  if (visibleHoursRange) {
    const visibleStartMinutes = visibleHoursRange.from * 60;
    const visibleEndMinutes = visibleHoursRange.to * 60;
    const visibleRangeMinutes = visibleEndMinutes - visibleStartMinutes;
    top = ((startMinutes - visibleStartMinutes) / visibleRangeMinutes) * 100;
  } else {
    top = (startMinutes / 1440) * 100;
  }

  const width = 100 / groupSize;
  const left = groupIndex * width;

  return { top: `${top}%`, width: `${width}%`, left: `${left}%` };
}

export function isWorkingHour(
  day: Date,
  hour: number,
  workingHours: TWorkingHours
) {
  // Map day index (0=Sunday, 1=Monday, etc.) to day name
  const dayIndexToName: Record<number, (typeof DAYS_OF_WEEK_IN_ORDER)[number]> =
    {
      0: "sunday",
      1: "monday",
      2: "tuesday",
      3: "wednesday",
      4: "thursday",
      5: "friday",
      6: "saturday",
    };

  const dayName = dayIndexToName[day.getDay()];
  if (!dayName) return false;

  // Find working hours for this day
  const dayWorkingHours = workingHours.filter((wh) => wh.dayOfWeek === dayName);
  if (dayWorkingHours.length === 0) return false;

  // Check if hour falls within any interval for this day
  return dayWorkingHours.some((wh) => {
    const [startHour] = wh.startTime.split(":").map(Number);
    const [endHour, endMinute] = wh.endTime.split(":").map(Number);
    const endHourDecimal = endHour + endMinute / 60;
    // Handle midnight (00:00) as 24
    const endHourFinal = endHour === 0 && endMinute === 0 ? 24 : endHourDecimal;
    return hour >= startHour && hour < endHourFinal;
  });
}

export function isWorkingInterval(
  day: Date,
  hour: number,
  minute: number,
  workingHours: TWorkingHours
) {
  // Map day index (0=Sunday, 1=Monday, etc.) to day name
  const dayIndexToName: Record<number, (typeof DAYS_OF_WEEK_IN_ORDER)[number]> =
    {
      0: "sunday",
      1: "monday",
      2: "tuesday",
      3: "wednesday",
      4: "thursday",
      5: "friday",
      6: "saturday",
    };

  const dayName = dayIndexToName[day.getDay()];
  if (!dayName) return false;

  // Find working hours for this day
  const dayWorkingHours = workingHours.filter((wh) => wh.dayOfWeek === dayName);
  if (dayWorkingHours.length === 0) return false;

  // Block interval [start, end)
  const blockStart = hour + minute / 60;
  const blockEnd = hour + (minute + 15) / 60;

  // Check if block overlaps with any working hour interval
  return dayWorkingHours.some((wh) => {
    const [startHour, startMinute] = wh.startTime.split(":").map(Number);
    const [endHour, endMinute] = wh.endTime.split(":").map(Number);
    const start = startHour + startMinute / 60;
    
    const endDecimal = endHour + endMinute / 60;
    const end = endHour === 0 && endMinute === 0 ? 24 : endDecimal;

    return start < blockEnd && end > blockStart;
  });
}

export function getVisibleHours(
  visibleHours: TVisibleHours,
  singleDayEvents: IEvent[]
) {
  let earliestEventHour = visibleHours.from;
  let latestEventHour = visibleHours.to;

  singleDayEvents.forEach((event) => {
    const startHour = parseISO(event.startDate).getHours();
    const endTime = parseISO(event.endDate);
    const endHour = endTime.getHours() + (endTime.getMinutes() > 0 ? 1 : 0);
    if (startHour < earliestEventHour) earliestEventHour = startHour;
    if (endHour > latestEventHour) latestEventHour = endHour;
  });

  latestEventHour = Math.min(latestEventHour, 24);

  const hours = Array.from(
    { length: latestEventHour - earliestEventHour },
    (_, i) => i + earliestEventHour
  );

  return { hours, earliestEventHour, latestEventHour };
}

// ================ Month view helper functions ================ //

export function getCalendarCells(selectedDate: Date): ICalendarCell[] {
  const currentYear = selectedDate.getFullYear();
  const currentMonth = selectedDate.getMonth();

  const getDaysInMonth = (year: number, month: number) =>
    new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year: number, month: number) =>
    new Date(year, month, 1).getDay();

  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDayOfMonth = getFirstDayOfMonth(currentYear, currentMonth);
  const daysInPrevMonth = getDaysInMonth(currentYear, currentMonth - 1);
  const totalDays = firstDayOfMonth + daysInMonth;

  const prevMonthCells = Array.from({ length: firstDayOfMonth }, (_, i) => ({
    day: daysInPrevMonth - firstDayOfMonth + i + 1,
    currentMonth: false,
    date: new Date(
      currentYear,
      currentMonth - 1,
      daysInPrevMonth - firstDayOfMonth + i + 1
    ),
  }));

  const currentMonthCells = Array.from({ length: daysInMonth }, (_, i) => ({
    day: i + 1,
    currentMonth: true,
    date: new Date(currentYear, currentMonth, i + 1),
  }));

  const nextMonthCells = Array.from(
    { length: (7 - (totalDays % 7)) % 7 },
    (_, i) => ({
      day: i + 1,
      currentMonth: false,
      date: new Date(currentYear, currentMonth + 1, i + 1),
    })
  );

  return [...prevMonthCells, ...currentMonthCells, ...nextMonthCells];
}

export function calculateMonthEventPositions(
  multiDayEvents: IEvent[],
  singleDayEvents: IEvent[],
  selectedDate: Date
) {
  const monthStart = startOfMonth(selectedDate);
  const monthEnd = endOfMonth(selectedDate);

  const eventPositions: { [key: string]: number } = {};
  const occupiedPositions: { [key: string]: boolean[] } = {};

  eachDayOfInterval({ start: monthStart, end: monthEnd }).forEach((day) => {
    occupiedPositions[day.toISOString()] = [false, false, false];
  });

  const sortedEvents = [
    ...multiDayEvents.sort((a, b) => {
      const aDuration = differenceInDays(
        parseISO(a.endDate),
        parseISO(a.startDate)
      );
      const bDuration = differenceInDays(
        parseISO(b.endDate),
        parseISO(b.startDate)
      );
      return (
        bDuration - aDuration ||
        parseISO(a.startDate).getTime() - parseISO(b.startDate).getTime()
      );
    }),
    ...singleDayEvents.sort(
      (a, b) =>
        parseISO(a.startDate).getTime() - parseISO(b.startDate).getTime()
    ),
  ];

  sortedEvents.forEach((event) => {
    const eventStart = parseISO(event.startDate);
    const eventEnd = parseISO(event.endDate);
    const eventDays = eachDayOfInterval({
      start: eventStart < monthStart ? monthStart : eventStart,
      end: eventEnd > monthEnd ? monthEnd : eventEnd,
    });

    let position = -1;

    for (let i = 0; i < 3; i++) {
      if (
        eventDays.every((day) => {
          const dayPositions = occupiedPositions[startOfDay(day).toISOString()];
          return dayPositions && !dayPositions[i];
        })
      ) {
        position = i;
        break;
      }
    }

    if (position !== -1) {
      eventDays.forEach((day) => {
        const dayKey = startOfDay(day).toISOString();
        occupiedPositions[dayKey][position] = true;
      });
      eventPositions[event.id] = position;
    }
  });

  return eventPositions;
}

export function getMonthCellEvents(
  date: Date,
  events: IEvent[],
  eventPositions: Record<string, number>
) {
  const eventsForDate = events.filter((event) => {
    const eventStart = parseISO(event.startDate);
    const eventEnd = parseISO(event.endDate);
    return (
      (date >= eventStart && date <= eventEnd) ||
      isSameDay(date, eventStart) ||
      isSameDay(date, eventEnd)
    );
  });

  return eventsForDate
    .map((event) => ({
      ...event,
      position: eventPositions[event.id] ?? -1,
      isMultiDay: event.startDate !== event.endDate,
    }))
    .sort((a, b) => {
      if (a.isMultiDay && !b.isMultiDay) return -1;
      if (!a.isMultiDay && b.isMultiDay) return 1;
      return a.position - b.position;
    });
}

// ================ Schedule conversion helper functions ================ //

/**
 * Converts database schedule format to TWorkingHours format
 * Now they use the same format, so this is just a direct mapping
 */
export function scheduleToWorkingHours(
  schedule: FullSchedule | null | undefined
): TWorkingHours {
  if (!schedule?.availabilities) {
    return [];
  }

  // Return availabilities directly since format is now the same
  return schedule.availabilities.map((availability) => ({
    dayOfWeek: availability.dayOfWeek,
    startTime: availability.startTime,
    endTime: availability.endTime,
  }));
}

/**
 * Converts TWorkingHours format to database schedule format
 * Now they use the same format, so this is just a wrapper
 */
export function workingHoursToSchedule(
  workingHours: TWorkingHours,
  timezone: string = Intl.DateTimeFormat().resolvedOptions().timeZone
): {
  timezone: string;
  availabilities: Array<{
    dayOfWeek: (typeof DAYS_OF_WEEK_IN_ORDER)[number];
    startTime: string;
    endTime: string;
  }>;
} {
  return {
    timezone,
    availabilities: workingHours,
  };
}

// ================ Availability validation helper functions ================ //

export function getAvailabilities(
  groupedAvailabilities: Partial<
    Record<
      (typeof DAYS_OF_WEEK_IN_ORDER)[number],
      (typeof scheduleAvailability.$inferSelect)[]
    >
  >,
  date: Date,
  timezone: string
): { start: Date; end: Date }[] {
  const dayOfWeek = (() => {
    if (isMonday(date)) return "monday";
    if (isTuesday(date)) return "tuesday";
    if (isWednesday(date)) return "wednesday";
    if (isThursday(date)) return "thursday";
    if (isFriday(date)) return "friday";
    if (isSaturday(date)) return "saturday";
    if (isSunday(date)) return "sunday";
    return null;
  })();

  if (!dayOfWeek) return [];

  const dayAvailabilities = groupedAvailabilities[dayOfWeek];
  if (!dayAvailabilities) return [];

  return dayAvailabilities.map(({ startTime, endTime }) => {
    const [startHour, startMinute] = startTime.split(":").map(Number);
    const [endHour, endMinute] = endTime.split(":").map(Number);

    const start = fromZonedTime(
      setMinutes(setHours(date, startHour), startMinute),
      timezone
    );

    const end = fromZonedTime(
      setMinutes(setHours(date, endHour), endMinute),
      timezone
    );

    return { start, end };
  });
}

/**
 * Lightweight point-in-time check: does the interval [startDateTime, endDateTime]
 * fall entirely within at least one of the user's availability windows?
 */
export function isTimeWithinAvailability(
  schedule: FullSchedule,
  startDateTime: Date,
  endDateTime: Date
): boolean {
  const groupedAvailabilities = Object.groupBy(
    schedule.availabilities,
    (a) => a.dayOfWeek
  );

  const availabilities = getAvailabilities(
    groupedAvailabilities,
    startDateTime,
    schedule.timezone
  );
  
  return availabilities.some(
    (availability) =>
      isWithinInterval(startDateTime, availability) &&
      isWithinInterval(endDateTime, availability)
  );
}
