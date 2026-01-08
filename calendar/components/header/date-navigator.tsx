import { useMemo } from "react";
import { formatDate } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { useCalendar } from "@/calendar/contexts/calendar-context";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import { getEventsCount, navigateDate, rangeText } from "@/calendar/helpers";

import type { IEvent } from "@/calendar/interfaces";
import type { TCalendarView } from "@/calendar/types";

interface IProps {
  view: TCalendarView;
  events: IEvent[];
}

export function DateNavigator({ view, events }: IProps) {
  const { selectedDate, setSelectedDate, locale } = useCalendar();

  const day = selectedDate.getDate();
  const month = formatDate(selectedDate, "MMMM", { locale });
  const year = selectedDate.getFullYear();

  const eventCount = useMemo(
    () => getEventsCount(events, selectedDate, view),
    [events, selectedDate, view]
  );

  const handlePrevious = () =>
    setSelectedDate(navigateDate(selectedDate, view, "previous"));
  const handleNext = () =>
    setSelectedDate(navigateDate(selectedDate, view, "next"));

  return (
    <div className="flex items-center gap-2 space-y-0.5">
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          className="size-6.5 px-0 [&_svg]:size-4.5"
          onClick={handlePrevious}
        >
          <ChevronLeft />
        </Button>

        {/* <p className="text-sm text-muted-foreground">
          {rangeText(view, selectedDate, locale)}
        </p> */}

        <Button
          variant="outline"
          className="size-6.5 px-0 [&_svg]:size-4.5"
          onClick={handleNext}
        >
          <ChevronRight />
        </Button>
      </div>
      <span className="text-lg font-semibold">
        {day} de {month} de {year}
      </span>
      <Badge variant="outline" className="px-1.5">
        {eventCount} consultas
      </Badge>
    </div>
  );
}
