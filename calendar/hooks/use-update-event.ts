import { format, parseISO } from "date-fns";
import { toast } from "sonner";

import { useCalendar } from "@/calendar/contexts/calendar-context";
import { useConfirm } from "@/contexts/confirm-action-context";
import { rescheduleAppointment } from "@/calendar/actions/appointments";

import type { IEvent } from "@/calendar/interfaces";

export function useUpdateEvent() {
  const { refetchAppointments } = useCalendar();
  const confirm = useConfirm();

  const updateEvent = async (event: IEvent) => {
    const newStart = parseISO(event.startDate);
    const newEnd = parseISO(event.endDate);

    const confirmed = await confirm({
      title: "Reagendar Consulta",
      description: `Mover "${event.title}" para ${format(newStart, "dd/MM/yyyy")} das ${format(newStart, "HH:mm")} às ${format(newEnd, "HH:mm")}?`,
    });

    if (!confirmed) return;

    try {
      const result = await rescheduleAppointment(
        String(event.id),
        event.startDate,
        event.endDate
      );

      if (!result.success) {
        toast.error(result.error || "Erro ao reagendar consulta");
        return;
      }

      toast.success("Consulta reagendada com sucesso");
      await refetchAppointments();
    } catch (error) {
      toast.error((error as Error).message || "Erro ao reagendar consulta");
    }
  };

  return { updateEvent };
}
