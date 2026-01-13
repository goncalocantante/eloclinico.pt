"use client";

import { useState, useEffect } from "react";
import { Moon, Plus, Trash2 } from "lucide-react";
import { useCalendar } from "@/calendar/contexts/calendar-context";

import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";

import type { TWorkingHours } from "@/calendar/types";
import { workingHoursToSchedule } from "@/calendar/helpers";
import { saveSchedule } from "@/server/actions/schedule";
import { toast } from "sonner";
import { DAYS_OF_WEEK_IN_ORDER } from "@/constants";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const DAYS_OF_WEEK = [
  { dayOfWeek: "sunday", name: "Sunday" },
  { dayOfWeek: "monday", name: "Monday" },
  { dayOfWeek: "tuesday", name: "Tuesday" },
  { dayOfWeek: "wednesday", name: "Wednesday" },
  { dayOfWeek: "thursday", name: "Thursday" },
  { dayOfWeek: "friday", name: "Friday" },
  { dayOfWeek: "saturday", name: "Saturday" },
] as const;

export function ChangeWorkingHoursInput() {
  const { workingHours, setWorkingHours, refetchSchedule, schedule } =
    useCalendar();

  const [localWorkingHours, setLocalWorkingHours] = useState<TWorkingHours>(
    () => workingHours || []
  );

  // Sync local state when workingHours from context changes (e.g., after loading from DB)
  useEffect(() => {
    setLocalWorkingHours(workingHours || []);
  }, [workingHours]);

  // Get intervals for a specific day
  const getDayIntervals = (
    dayOfWeek: (typeof DAYS_OF_WEEK_IN_ORDER)[number]
  ): TWorkingHours => {
    return localWorkingHours.filter((wh) => wh.dayOfWeek === dayOfWeek);
  };

  // Check if a day is active (has intervals)
  const isDayActive = (dayOfWeek: (typeof DAYS_OF_WEEK_IN_ORDER)[number]) => {
    return getDayIntervals(dayOfWeek).length > 0;
  };

  const handleToggleDay = (
    dayOfWeek: (typeof DAYS_OF_WEEK_IN_ORDER)[number]
  ) => {
    setLocalWorkingHours((prev: TWorkingHours) => {
      const isActive = isDayActive(dayOfWeek);
      if (isActive) {
        // Remove all intervals for this day
        return prev.filter((wh) => wh.dayOfWeek !== dayOfWeek);
      } else {
        // Add default interval for this day
        return [...prev, { dayOfWeek, startTime: "09:00", endTime: "17:00" }];
      }
    });
  };

  const handleAddInterval = (
    dayOfWeek: (typeof DAYS_OF_WEEK_IN_ORDER)[number]
  ) => {
    setLocalWorkingHours((prev: TWorkingHours) => {
      const dayIntervals = getDayIntervals(dayOfWeek);
      const lastInterval = dayIntervals[dayIntervals.length - 1];

      // Parse last end time or default to 09:00
      let defaultStart = "09:00";
      if (lastInterval) {
        const [endHour, endMinute] = lastInterval.endTime
          .split(":")
          .map(Number);
        const nextHour = (endHour + 1) % 24;
        defaultStart = `${String(nextHour).padStart(2, "0")}:${String(
          endMinute
        ).padStart(2, "0")}`;
      }

      // Default end time is 4 hours after start
      const [startHour] = defaultStart.split(":").map(Number);
      const defaultEndHour = Math.min(startHour + 4, 23);
      const defaultEnd = `${String(defaultEndHour).padStart(2, "0")}:00`;

      return [
        ...prev,
        { dayOfWeek, startTime: defaultStart, endTime: defaultEnd },
      ];
    });
  };

  const handleRemoveInterval = (
    dayOfWeek: (typeof DAYS_OF_WEEK_IN_ORDER)[number],
    intervalIndex: number
  ) => {
    setLocalWorkingHours((prev: TWorkingHours) => {
      const dayIntervals = prev.filter(
        (wh: TWorkingHours[number]) => wh.dayOfWeek === dayOfWeek
      );
      if (dayIntervals.length <= 1) return prev; // Don't remove if it's the last one

      const otherIntervals = prev.filter(
        (wh: TWorkingHours[number]) => wh.dayOfWeek !== dayOfWeek
      );
      const updatedDayIntervals = dayIntervals.filter(
        (_: TWorkingHours[number], index: number) => index !== intervalIndex
      );
      return [...otherIntervals, ...updatedDayIntervals];
    });
  };

  const handleTimeChange = (
    dayOfWeek: (typeof DAYS_OF_WEEK_IN_ORDER)[number],
    intervalIndex: number,
    timeType: "startTime" | "endTime",
    value: string
  ) => {
    setLocalWorkingHours((prev: TWorkingHours) => {
      const dayIntervals = prev.filter(
        (wh: TWorkingHours[number]) => wh.dayOfWeek === dayOfWeek
      );
      const otherIntervals = prev.filter(
        (wh: TWorkingHours[number]) => wh.dayOfWeek !== dayOfWeek
      );

      const updatedDayIntervals = dayIntervals.map(
        (interval: TWorkingHours[number], index: number) => {
          if (index === intervalIndex) {
            return { ...interval, [timeType]: value };
          }
          return interval;
        }
      );

      return [...otherIntervals, ...updatedDayIntervals];
    });
  };

  const handleSave = async () => {
    try {
      // Validate and sort intervals
      const validWorkingHours = localWorkingHours
        .filter((wh: TWorkingHours[number]) => {
          const [startHour, startMinute] = wh.startTime.split(":").map(Number);
          const [endHour, endMinute] = wh.endTime.split(":").map(Number);
          const startDecimal = startHour + startMinute / 60;
          const endDecimal = endHour + endMinute / 60;
          return (
            startDecimal >= 0 && endDecimal > startDecimal && endDecimal <= 24
          );
        })
        .sort((a: TWorkingHours[number], b: TWorkingHours[number]) => {
          // Sort by day of week first
          const dayOrder =
            DAYS_OF_WEEK_IN_ORDER.indexOf(a.dayOfWeek) -
            DAYS_OF_WEEK_IN_ORDER.indexOf(b.dayOfWeek);
          if (dayOrder !== 0) return dayOrder;
          // Then by start time
          return a.startTime.localeCompare(b.startTime);
        });

      // Convert to schedule format and save to database
      const timezone =
        schedule?.timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone;
      const scheduleData = workingHoursToSchedule(validWorkingHours, timezone);
      await saveSchedule(scheduleData);

      // Update context
      setWorkingHours(validWorkingHours);

      // Refetch schedule from database to ensure consistency
      await refetchSchedule();

      toast.success("Working hours saved successfully");
    } catch (error: any) {
      toast.error(
        error.message || "Failed to save working hours. Please try again."
      );
    }
  };

  // Generate time options in 15-minute increments
  const timeOptions = Array.from({ length: 24 * 4 }).map((_, i) => {
    const hours = Math.floor(i / 4);
    const minutes = (i % 4) * 15;
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(
      2,
      "0"
    )}`;
  });

  return (
    <div className="flex flex-col gap-2">
      <div className="space-y-4">
        {DAYS_OF_WEEK.map((day) => {
          const intervals = getDayIntervals(day.dayOfWeek);
          const active = isDayActive(day.dayOfWeek);

          return (
            <div
              key={day.dayOfWeek}
              className="flex flex-col gap-4 border-b py-4 last:border-0 sm:flex-row sm:items-start"
            >
              <div className="flex w-32 shrink-0 items-center gap-2 pt-2">
                <Switch
                  checked={active}
                  onCheckedChange={() => handleToggleDay(day.dayOfWeek)}
                />
                <span className="text-sm font-medium">{day.name}</span>
              </div>

              <div className="flex min-h-[40px] flex-1 items-center">
                {!active ? (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Moon className="size-4" />
                    <span>Descanso</span>
                  </div>
                ) : (
                  <div className="flex flex-wrap items-center gap-3">
                    {intervals.map(
                      (
                        interval: TWorkingHours[number],
                        intervalIndex: number
                      ) => (
                        <div
                          key={intervalIndex}
                          className="flex items-center gap-2"
                        >
                          <Select
                            value={interval.startTime}
                            onValueChange={(value) =>
                              handleTimeChange(
                                day.dayOfWeek,
                                intervalIndex,
                                "startTime",
                                value
                              )
                            }
                          >
                            <SelectTrigger className="w-[95px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="h-48">
                              {timeOptions.map((time) => (
                                <SelectItem key={time} value={time}>
                                  {time}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>

                          <span className="text-muted-foreground">-</span>

                          <Select
                            value={interval.endTime}
                            onValueChange={(value) =>
                              handleTimeChange(
                                day.dayOfWeek,
                                intervalIndex,
                                "endTime",
                                value
                              )
                            }
                          >
                            <SelectTrigger className="w-[95px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="h-48">
                              {timeOptions.map((time) => (
                                <SelectItem key={time} value={time}>
                                  {time}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>

                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="size-8 text-muted-foreground hover:text-foreground"
                            onClick={() =>
                              handleRemoveInterval(day.dayOfWeek, intervalIndex)
                            }
                            disabled={intervals.length === 1}
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </div>
                      )
                    )}

                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="size-8"
                      onClick={() => handleAddInterval(day.dayOfWeek)}
                    >
                      <Plus className="size-4" />
                    </Button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <Button className="mt-4 w-fit" onClick={handleSave}>
        Guardar alterações
      </Button>
    </div>
  );
}
