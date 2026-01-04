"use client";

import { DAYS_OF_WEEK_IN_ORDER } from "@/constants";
import { scheduleFormSchema } from "@/schema/schedule";
import { timeToFloat } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { useFieldArray, useForm } from "react-hook-form";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { formatTimezoneOffset } from "@/lib/formatters";
import { Fragment } from "react";
import { Button } from "../ui/button";
import { Plus, X } from "lucide-react";
import { Input } from "../ui/input";
import { toast } from "sonner";
import { saveSchedule } from "@/server/actions/schedule";

// Define the Availability type
type Availability = {
  startTime: string;
  endTime: string;
  dayOfWeek: (typeof DAYS_OF_WEEK_IN_ORDER)[number];
  // if you don't use [number]
  // you're referring to the entire array type, not the individual values inside it.
};

export function ScheduleForm({
  schedule,
}: {
  schedule?: {
    timezone: string;
    availabilities: Availability[];
  };
}) {
  // Initialize form with validation schema and default values
  const form = useForm<z.infer<typeof scheduleFormSchema>>({
    resolver: zodResolver(scheduleFormSchema),
    defaultValues: {
      timezone:
        schedule?.timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone,
      availabilities: schedule?.availabilities.toSorted((a, b) => {
        return timeToFloat(a.startTime) - timeToFloat(b.startTime);
      }),
    },
  });

  // Manage dynamic form fields for availability using useFieldArray
  const {
    append: addAvailability, // Add a new availability entry
    remove: removeAvailability, // Remove availability entry
    fields: availabilityFields, // Current availability fields
  } = useFieldArray({ name: "availabilities", control: form.control });

  // Group availability fields by day of the week for UI rendering
  const groupedAvailabilityFields = Object.groupBy(
    availabilityFields.map((field, index) => ({ ...field, index })),
    (availability) => availability.dayOfWeek
  );

  // Submit handler to save schedule
  async function onSubmit(values: z.infer<typeof scheduleFormSchema>) {
    try {
      await saveSchedule(values);
      toast.success("Disponibilidade guardada com sucesso");
    } catch (error: any) {
      // Handle any unexpected errors that occur during the schedule saving process
      form.setError("root", {
        message: `Houve um erro ao guardar a sua disponibilidade: ${error.message}`,
      });
    }
  }

  return (
    <Form {...form}>
      <form
        className="flex gap-6 flex-col"
        onSubmit={form.handleSubmit(onSubmit)}
      >
        {/* Show form-level error if any */}
        {form.formState.errors.root && (
          <div className="text-destructive text-sm">
            {form.formState.errors.root.message}
          </div>
        )}

        {/* Timezone selection */}
        <FormField
          control={form.control}
          name="timezone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Timezone</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {Intl.supportedValuesOf("timeZone").map((timezone) => (
                    <SelectItem key={timezone} value={timezone}>
                      {timezone}
                      {` (${formatTimezoneOffset(timezone)})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Availability form grid grouped by day */}
        <div className="grid grid-cols-[auto_auto]  gap-y-6">
          {DAYS_OF_WEEK_IN_ORDER.map((dayOfWeek) => (
            <Fragment key={dayOfWeek}>
              {/* Day label */}
              <div className="capitalize text-sm font-semibold">
                {dayOfWeek.substring(0, 3)}
              </div>

              {/* Add availability for a specific day */}
              <div className="flex flex-col gap-2">
                <Button
                  type="button"
                  className="size-6 p-1 cursor-pointer hover:scale-200"
                  variant="outline"
                  onClick={() => {
                    addAvailability({
                      dayOfWeek,
                      startTime: "9:00",
                      endTime: "17:00",
                    });
                  }}
                >
                  <Plus color="red" />
                </Button>

                {/* Render availability entries for this day */}
                {groupedAvailabilityFields[dayOfWeek]?.map(
                  (field, labelIndex) => (
                    <div className="flex flex-col gap-1" key={field.id}>
                      <div className="flex gap-2 items-center">
                        {/* Start time input */}
                        <FormField
                          control={form.control}
                          name={`availabilities.${field.index}.startTime`}
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Input
                                  className="w-24"
                                  aria-label={`${dayOfWeek} Start Time ${
                                    labelIndex + 1
                                  }`}
                                  {...field}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        -{/* End time input */}
                        <FormField
                          control={form.control}
                          name={`availabilities.${field.index}.endTime`}
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Input
                                  className="w-24"
                                  aria-label={`${dayOfWeek} End Time ${
                                    labelIndex + 1
                                  }`}
                                  {...field}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        {/* Remove availability */}
                        <Button
                          type="button"
                          className="size-6 p-1 cursor-pointer hover:bg-red-900"
                          variant="destructive"
                          onClick={() => removeAvailability(field.index)}
                        >
                          <X />
                        </Button>
                      </div>

                      {/* Show field-level validation messages */}
                      <FormMessage>
                        {
                          form.formState.errors.availabilities?.at?.(
                            field.index
                          )?.root?.message
                        }
                      </FormMessage>
                      <FormMessage>
                        {
                          form.formState.errors.availabilities?.at?.(
                            field.index
                          )?.startTime?.message
                        }
                      </FormMessage>
                      <FormMessage>
                        {
                          form.formState.errors.availabilities?.at?.(
                            field.index
                          )?.endTime?.message
                        }
                      </FormMessage>
                    </div>
                  )
                )}
              </div>
            </Fragment>
          ))}
        </div>

        {/* Save button */}
        <div className="flex gap-2 justify-start">
          <Button
            className="cursor-pointer hover:scale-105 bg-blue-400 hover:bg-blue-600"
            disabled={form.formState.isSubmitting}
            type="submit"
          >
            Save
          </Button>
        </div>
      </form>
    </Form>
  );
}
