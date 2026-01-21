"use client";

import { format, parseISO } from "date-fns";
import { Calendar, Clock, Text, User } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { EditAppointmentDialog } from "@/calendar/components/dialogs/edit-appointment-dialog";
import {
  Dialog,
  DialogContent,
  // DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useConfirm } from "@/contexts/confirm-action-context";
import { useCalendar } from "@/calendar/contexts/calendar-context";
import { deleteAppointment } from "@/calendar/actions/appointments";
import { useDisclosure } from "@/hooks/use-disclosure";

import type { IEvent } from "@/calendar/interfaces";

interface IProps {
  event: IEvent;
  children: React.ReactNode;
}

export function EventDetailsDialog({ event, children }: IProps) {
  const startDate = parseISO(event.startDate);
  const endDate = parseISO(event.endDate);
  const confirm = useConfirm();
  const { refetchAppointments } = useCalendar();
  const { isOpen, onClose, onToggle } = useDisclosure();

  const handleDelete = async () => {
    const result = await confirm({
      title: "Cancelar Consulta",
      description:
        "Tem a certeza que deseja cancelar esta consulta? Esta ação é irreversível.",
    });

    if (result) {
      try {
        const deleteResult = await deleteAppointment(String(event.id));

        if (deleteResult.success) {
          toast.success("Consulta cancelada com sucesso");
          await refetchAppointments();
          onClose();
        } else {
          toast.error(deleteResult.error || "Erro ao cancelar consulta");
        }
      } catch (error) {
        toast.error((error as Error).message || "Erro ao cancelar consulta");
      }
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onToggle}>
        <DialogTrigger asChild>{children}</DialogTrigger>

        <DialogContent showDeleteButton={true} onDelete={handleDelete}>
          <DialogHeader>
            <DialogTitle>{event.title}</DialogTitle>
            <EditAppointmentDialog event={event}>
              <Button type="button" variant="outline">
                Edit
              </Button>
            </EditAppointmentDialog>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex items-start gap-2">
              <User className="mt-1 size-4 shrink-0" />
              <div>
                <p className="text-sm font-medium">Doctor</p>
                <p className="text-sm text-muted-foreground">
                  {event.user.name}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <Calendar className="mt-1 size-4 shrink-0" />
              <div>
                <p className="text-sm font-medium">Start Date</p>
                <p className="text-sm text-muted-foreground">
                  {format(startDate, "MMM d, yyyy h:mm a")}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <Clock className="mt-1 size-4 shrink-0" />
              <div>
                <p className="text-sm font-medium">End Date</p>
                <p className="text-sm text-muted-foreground">
                  {format(endDate, "MMM d, yyyy h:mm a")}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <Text className="mt-1 size-4 shrink-0" />
              <div>
                <p className="text-sm font-medium">Notes</p>
                <p className="text-sm text-muted-foreground">{event.notes}</p>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <div
                className={`mt-1 size-4 shrink-0 rounded-full bg-${event.color}-600`}
              />
              <div>
                <p className="text-sm font-medium">Color</p>
                <p className="text-sm text-muted-foreground capitalize">
                  {event.color}
                </p>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
