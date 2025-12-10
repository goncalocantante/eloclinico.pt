"use client";

import { format, parseISO } from "date-fns";
import { Calendar, Clock, Text, User } from "lucide-react";

import { Button } from "@/components/ui/button";
import { EditAppointmentDialog } from "@/calendar/components/dialogs/edit-appointment-dialog";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useCalendar } from "@/calendar/contexts/calendar-context";

import type { IEvent } from "@/calendar/interfaces";
import { useEffect } from "react";
import useSWR from "swr";
import { Patient } from "@/lib/db/schema";
import { fetcher } from "@/lib/utils";

interface IProps {
  event: IEvent;
  children: React.ReactNode;
}

export function EventDetailsDialog({ event, children }: IProps) {
  const startDate = parseISO(event.startDate);
  const endDate = parseISO(event.endDate);

  const { events: appointmentTypes } = useCalendar();

  const { data: patients = [] } = useSWR<Patient[]>("/api/patients", fetcher);

  return (
    <>
      <Dialog>
        <DialogTrigger asChild>{children}</DialogTrigger>

        <DialogContent>
          <DialogHeader>
            <DialogTitle>{event.title}</DialogTitle>
          </DialogHeader>

          <div className="flex items-start gap-2">
            <User className="mt-1 size-4 shrink-0" />
            <div>
              <p className="text-sm font-medium">Patient</p>
              <p className="text-sm text-muted-foreground">
                {
                  patients.find((patient) => patient.id === event.patientId)
                    ?.name
                }
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-start gap-2">
              <Clock className="mt-1 size-4 shrink-0" />
              <div>
                <span className="text-sm text-muted-foreground">
                  {format(startDate, "MMM d, yyyy")}
                </span>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span className="text-sm text-muted-foreground">
                    {format(startDate, "kk:mm")} - {format(endDate, "kk:mm")}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <User className="mt-1 size-4 shrink-0" />
              <div>
                <p className="text-sm font-medium">Appointment Type</p>
                <p className="text-sm text-muted-foreground">
                  {
                    appointmentTypes.find(
                      (type) => type.id === event.appointmentType
                    )?.name
                  }
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
          </div>

          <DialogFooter>
            <EditAppointmentDialog event={event}>
              <Button type="button" variant="outline">
                Edit
              </Button>
            </EditAppointmentDialog>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
