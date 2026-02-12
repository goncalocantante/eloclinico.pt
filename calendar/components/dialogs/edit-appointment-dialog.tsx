"use client";

import { addMinutes, format, parseISO } from "date-fns";
import { useEffect } from "react";
import { useForm, useWatch } from "react-hook-form";
import {
  Check,
  ChevronDownIcon,
  ChevronsUpDown,
} from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import useSWR from "swr";

import { useDisclosure } from "@/hooks/use-disclosure";
import { useCalendar } from "@/calendar/contexts/calendar-context";
import { fetcher } from "@/lib/utils";
import type { Patient } from "@/lib/db/schema";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { TEventColor } from "@/calendar/types";
import {
  Form,
  FormField,
  FormLabel,
  FormItem,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectItem,
  SelectContent,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogHeader,
  DialogClose,
  DialogContent,
  DialogTrigger,
  DialogTitle,
  // DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import { eventSchema } from "@/calendar/schemas";
import { updateAppointment } from "../../actions/appointments";

import { cn } from "@/lib/utils";

import type { IEvent } from "@/calendar/interfaces";
import type { TEventFormData } from "@/calendar/schemas";

interface IProps {
  children: React.ReactNode;
  event: IEvent;
}

export function EditAppointmentDialog({ children, event }: IProps) {
  const { isOpen, onClose, onToggle } = useDisclosure();

  const { refetchAppointments, events: appointmentTypes } = useCalendar();

  const { data: patients = [] } = useSWR<Patient[]>("/api/patients", fetcher);

  const form = useForm<TEventFormData>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      userId: event.user.id,
      patientId: event.patientId,
      appointmentType: event.appointmentType as string,
      startDate: parseISO(event.startDate),
      startTime: `${String(parseISO(event.startDate).getHours()).padStart(
        2,
        "0"
      )}:${String(parseISO(event.startDate).getMinutes()).padStart(2, "0")}`,
      endTime: `${String(parseISO(event.endDate).getHours()).padStart(
        2,
        "0"
      )}:${String(parseISO(event.endDate).getMinutes()).padStart(2, "0")}`,
      notes: event.notes,
      color: (event.color as TEventColor) ?? "blue",
    },
  });

  const watchedAppointmentTypeId = useWatch({ control: form.control, name: "appointmentType" });
  const watchedStartTime = useWatch({ control: form.control, name: "startTime" });

  useEffect(() => {
    if (watchedAppointmentTypeId && appointmentTypes) {
      const selectedType = appointmentTypes.find(
        (t) => t.id === watchedAppointmentTypeId
      );

      if (selectedType) {
        if (selectedType.color) {
          form.setValue("color", selectedType.color);
        }

        if (watchedStartTime) {
          const [hours, minutes] = watchedStartTime.split(":").map(Number);
          const date = new Date();
          date.setHours(hours);
          date.setMinutes(minutes);

          const endDate = addMinutes(date, selectedType.durationInMinutes);
          form.setValue("endTime", format(endDate, "HH:mm"));
        }
      }
    }
  }, [watchedAppointmentTypeId, watchedStartTime, appointmentTypes, form]);

  const onSubmit = async (values: TEventFormData) => {
    const patientName = patients.find(
      (patient) => patient.id === values.patientId
    )?.name;
    const appointmentTypeName = appointmentTypes.find(
      (type) => type.id === values.appointmentType
    )?.name;

    await updateAppointment(String(event.id), {
      ...values,
      title: appointmentTypeName + " - " + patientName,
    });

    // Refetch appointments from the database after creating a new one
    await refetchAppointments();
    onClose();
    form.reset();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onToggle}>
      <DialogTrigger asChild>{children}</DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Appointment</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form
            id="event-form"
            onSubmit={form.handleSubmit(onSubmit)}
            className="grid gap-4 py-4"
          >
            <FormField
              control={form.control}
              name="patientId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Patient</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          role="combobox"
                          className="w-[200px] justify-between"
                        >
                          {field.value
                            ? patients.find(
                              (patient) => patient.id === field.value
                            )?.name
                            : "Select patient"}
                          <ChevronsUpDown className="opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-[200px] p-0">
                      <Command>
                        <CommandInput
                          placeholder="Search patient..."
                          className="h-9"
                        />
                        <CommandList>
                          <CommandEmpty>No patient found.</CommandEmpty>
                          <CommandGroup>
                            {patients.map((patient) => (
                              <CommandItem
                                key={patient.id}
                                value={patient.name || undefined}
                                onSelect={() => {
                                  form.setValue("patientId", patient.id);
                                }}
                              >
                                {patient.name}
                                <Check
                                  className={cn(
                                    "ml-auto",
                                    field.value === patient.id
                                      ? "opacity-100"
                                      : "opacity-0"
                                  )}
                                />
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="appointmentType"
              render={({ field, fieldState }) => (
                <FormItem>
                  <FormLabel>Appointment Type</FormLabel>
                  <FormControl>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className="w-full" aria-invalid={fieldState.invalid}>
                        <SelectValue placeholder="Select an option" />
                      </SelectTrigger>
                      <SelectContent>
                        {appointmentTypes.map((type, index) => (
                          <SelectItem value={type.id} key={index}>
                            <div className="flex items-center gap-2">
                              {type.name}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex items-start gap-2">
              <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormLabel htmlFor="startDate">Start Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            id="date"
                            className="w-48 justify-between font-normal"
                          >
                            {field.value
                              ? field.value.toLocaleDateString()
                              : "Select date"}
                            <ChevronDownIcon />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent
                        className="w-auto overflow-hidden p-0"
                        align="start"
                      >
                        <Calendar
                          mode="single"
                          selected={field.value}
                          captionLayout="dropdown"
                          onSelect={field.onChange}
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="startTime"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormLabel>Start Time</FormLabel>

                    <FormControl>
                      <Input
                        {...field}
                        type="time"
                      // step="1"
                      // className="appearance-none [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
                      />
                    </FormControl>

                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="endTime"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormLabel>End Time</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="time"
                      // step="1"
                      // className="appearance-none [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="color"
              render={({ field, fieldState }) => (
                <FormItem>
                  <FormLabel>Color</FormLabel>
                  <FormControl>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger aria-invalid={fieldState.invalid}>
                        <SelectValue placeholder="Select an option" />
                      </SelectTrigger>

                      <SelectContent>
                        <SelectItem value="blue">
                          <div className="flex items-center gap-2">
                            <div className="size-3.5 rounded-full bg-blue-600" />
                            Blue
                          </div>
                        </SelectItem>

                        <SelectItem value="green">
                          <div className="flex items-center gap-2">
                            <div className="size-3.5 rounded-full bg-green-600" />
                            Green
                          </div>
                        </SelectItem>

                        <SelectItem value="red">
                          <div className="flex items-center gap-2">
                            <div className="size-3.5 rounded-full bg-red-600" />
                            Red
                          </div>
                        </SelectItem>

                        <SelectItem value="yellow">
                          <div className="flex items-center gap-2">
                            <div className="size-3.5 rounded-full bg-yellow-600" />
                            Yellow
                          </div>
                        </SelectItem>

                        <SelectItem value="purple">
                          <div className="flex items-center gap-2">
                            <div className="size-3.5 rounded-full bg-purple-600" />
                            Purple
                          </div>
                        </SelectItem>

                        <SelectItem value="orange">
                          <div className="flex items-center gap-2">
                            <div className="size-3.5 rounded-full bg-orange-600" />
                            Orange
                          </div>
                        </SelectItem>

                        <SelectItem value="gray">
                          <div className="flex items-center gap-2">
                            <div className="size-3.5 rounded-full bg-neutral-600" />
                            Gray
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>

                  <FormControl>
                    <Textarea
                      {...field}
                      value={field.value}
                    />
                  </FormControl>

                  <FormMessage />
                </FormItem>
              )}
            />
          </form>
        </Form>

        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline">
              Cancelar
            </Button>
          </DialogClose>

          <Button form="event-form" type="submit">
            Guardar alterações
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
