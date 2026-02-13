"use client";

import { useEffect } from "react";
import { useForm, useWatch } from "react-hook-form";
import { Check, ChevronDownIcon, ChevronsUpDown } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import useSWR from "swr";
import { addMinutes, format } from "date-fns";
import { toast } from "sonner";

import { useCalendar } from "@/calendar/contexts/calendar-context";
import { fetcher } from "@/lib/utils";
import type { Patient } from "@/lib/db/schema";

import { createAppointment } from "../../actions/appointments";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Textarea } from "@/components/ui/textarea";
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
  DialogDescription,
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

import { eventSchema, TEventFormData } from "@/calendar/schemas";

import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";

interface IProps {
  children?: React.ReactNode;
}

export function AddAppointmentDialog({ children }: IProps) {
  const {
    refetchAppointments,
    events: appointmentTypes,
    isAddAppointmentDialogOpen,
    addAppointmentDialogState,
    closeAddAppointmentDialog,
  } = useCalendar();

  // Fetch patients directly in this component since they're only used here
  const { data: patients = [] } = useSWR<Patient[]>("/api/patients", fetcher);

  const form = useForm<TEventFormData>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      patientId: undefined,
      appointmentType: appointmentTypes?.[0]?.name,
      startDate: undefined,
      startTime: undefined,
      endTime: undefined,
      notes: "",
      color: "blue",
    },
  });

  const onSubmit = async (_values: TEventFormData) => {
    const patientName = patients.find(
      (patient) => patient.id === _values.patientId
    )?.name;
    const appointmentTypeName = appointmentTypes.find(
      (type) => type.id === _values.appointmentType
    )?.name;

    try {
      const result = await createAppointment({
        ..._values,
        title: appointmentTypeName + " - " + patientName,
      });

      if (!result.success) {
        toast.error(result.error || "Erro ao agendar consulta");
        return;
      }

      toast.success("Consulta agendada com sucesso");
      await refetchAppointments();
      closeAddAppointmentDialog();
      form.reset();
    } catch (error) {
      toast.error((error as Error).message || "Erro ao agendar consulta");
    }
  };

  // Update form when dialog state changes
  useEffect(() => {
    if (isAddAppointmentDialogOpen) {
      form.reset({
        patientId: addAppointmentDialogState.patientId || undefined,
        appointmentType: appointmentTypes?.[0]?.name,
        startDate: addAppointmentDialogState.startDate || undefined,
        startTime: addAppointmentDialogState.startTime || undefined,
        endTime: addAppointmentDialogState.endTime || undefined,
        notes: "",
        color: "blue",
      });
    }
  }, [
    isAddAppointmentDialogOpen,
    addAppointmentDialogState,
    appointmentTypes,
    form,
  ]);

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

  return (
    <Dialog
      open={isAddAppointmentDialogOpen}
      onOpenChange={(open) => {
        if (!open) {
          closeAddAppointmentDialog();
        }
      }}
    >
      {children && <DialogTrigger asChild>{children}</DialogTrigger>}

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Agendar Consulta</DialogTitle>
          <DialogDescription></DialogDescription>
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
                  <FormLabel>Paciente</FormLabel>
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
                            : "Selecionar paciente"}
                          <ChevronsUpDown className="opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-[200px] p-0">
                      <Command>
                        <CommandInput
                          placeholder="Pesquisar paciente..."
                          className="h-9"
                        />
                        <CommandList>
                          <CommandEmpty>Nenhum paciente encontrado.</CommandEmpty>
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
                  <FormLabel>Tipo de Consulta</FormLabel>
                  <FormControl>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className="w-full" aria-invalid={fieldState.invalid}>
                        <SelectValue placeholder="Selecionar tipo de consulta" />
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
                    <FormLabel htmlFor="startDate">Data de Início</FormLabel>
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
                              : "Selecionar data"}
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
                    <FormLabel>Hora de Início</FormLabel>

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
                    <FormLabel>Hora de Fim</FormLabel>
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
                  <FormLabel>Cor</FormLabel>
                  <FormControl>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger aria-invalid={fieldState.invalid}>
                        <SelectValue placeholder="Selecionar opção" />
                      </SelectTrigger>

                      <SelectContent>
                        <SelectItem value="blue">
                          <div className="flex items-center gap-2">
                            <div className="size-3.5 rounded-full bg-blue-600" />
                            Azul
                          </div>
                        </SelectItem>

                        <SelectItem value="green">
                          <div className="flex items-center gap-2">
                            <div className="size-3.5 rounded-full bg-green-600" />
                            Verde
                          </div>
                        </SelectItem>

                        <SelectItem value="red">
                          <div className="flex items-center gap-2">
                            <div className="size-3.5 rounded-full bg-red-600" />
                            Vermelho
                          </div>
                        </SelectItem>

                        <SelectItem value="yellow">
                          <div className="flex items-center gap-2">
                            <div className="size-3.5 rounded-full bg-yellow-600" />
                            Amarelo
                          </div>
                        </SelectItem>

                        <SelectItem value="purple">
                          <div className="flex items-center gap-2">
                            <div className="size-3.5 rounded-full bg-purple-600" />
                            Roxo
                          </div>
                        </SelectItem>

                        <SelectItem value="orange">
                          <div className="flex items-center gap-2">
                            <div className="size-3.5 rounded-full bg-orange-600" />
                            Laranja
                          </div>
                        </SelectItem>

                        <SelectItem value="gray">
                          <div className="flex items-center gap-2">
                            <div className="size-3.5 rounded-full bg-neutral-600" />
                            Cinzento
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
                  <FormLabel>Notas</FormLabel>

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
            Agendar Consulta
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
