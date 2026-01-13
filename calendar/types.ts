import { DAYS_OF_WEEK_IN_ORDER } from "@/constants";

export type TCalendarView = "day" | "week" | "month" | "year" | "agenda";
export type TEventColor =
  | "blue"
  | "green"
  | "red"
  | "yellow"
  | "purple"
  | "orange"
  | "gray";
export type TBadgeVariant = "dot" | "colored" | "mixed";
// Working hours now uses the same format as database schedule
export type TWorkingHours = Array<{
  dayOfWeek: (typeof DAYS_OF_WEEK_IN_ORDER)[number];
  startTime: string; // Format: "HH:MM" (24-hour)
  endTime: string; // Format: "HH:MM" (24-hour)
}>;
export type TVisibleHours = { from: number; to: number };
