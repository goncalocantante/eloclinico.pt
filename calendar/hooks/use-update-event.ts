import { useCalendar } from "@/calendar/contexts/calendar-context";

import type { IEvent } from "@/calendar/interfaces";

export function useUpdateEvent() {
  const { events, refetchEvents } = useCalendar();

  // This is just and example, in a real scenario
  // you would call an API to update the event
  const updateEvent = (event: IEvent) => {
    const newEvent: IEvent = event;

    newEvent.startDate = new Date(event.startDate).toISOString();
    newEvent.endDate = new Date(event.endDate).toISOString();

    refetchEvents();
  };

  return { updateEvent };
}
