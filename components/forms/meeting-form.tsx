// This React component, `MeetingForm`, is a client-side form built with `react-hook-form` and `zod` validation, allowing users to schedule a meeting by selecting a timezone, date, and time, and providing their name, email, and optional notes. It uses various custom UI components (like `Select`, `Calendar`, and `Popover`) for a smooth user experience. The form filters available meeting times (`validTimes`) based on the user's selected timezone and date, ensuring only valid options are shown. Upon submission, it sends the form data along with the `eventId` and `userId` to a backend function (`createMeeting`) to create the meeting, and handles any server-side errors by displaying them in the UI.

"use client";
import { meetingFormSchema } from "@/schema/meetings";
import { createMeeting } from "@/server/actions/meetings";
import { zodResolver } from "@hookform/resolvers/zod";
import { toZonedTime } from "date-fns-tz";
import { useRouter } from "next/navigation";
import { useMemo } from "react";
import { useForm } from "react-hook-form";
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
import {
  formatDate,
  formatTimeString,
  formatTimezoneOffset,
} from "@/lib/formatters";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Button } from "../ui/button";
import { cn } from "@/lib/utils";
import { CalendarIcon } from "lucide-react";
import { Calendar } from "../ui/calendar";
import { isSameDay } from "date-fns";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import Link from "next/link";
import Booking from "../booking";

// Enables client-side rendering for this component

export default function MeetingForm({
  validTimes,
  eventId,
  userId,
}: {
  validTimes: Date[]; // Predefined list of available times
  eventId: string; // ID of the event to associate with the meeting
  userId: string; // User ID from authentication system
}) {
  const router = useRouter();

  // Initialize form using React Hook Form and Zod schema
  // Create a form using React Hook Form with Zod for validation
  const form = useForm<z.infer<typeof meetingFormSchema>>({
    // Use zodResolver to connect Zod schema to React Hook Form
    resolver: zodResolver(meetingFormSchema),

    // Set initial default values for the form fields
    defaultValues: {
      // Automatically detect the user's local timezone
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,

      // Start with empty fields for guest info
      guestName: "",
      guestEmail: "",
      guestNotes: "",
    },
  });

  // Watch timezone and selected date fields for updates
  const timezone = form.watch("timezone");
  const date = form.watch("date");

  // Convert valid times to the selected timezone
  const validTimesInTimezone = useMemo(() => {
    return validTimes.map((date) => toZonedTime(date, timezone));
  }, [validTimes, timezone]);

  // Handle form submission
  async function onSubmit(values: z.infer<typeof meetingFormSchema>) {
    try {
      // Call the createMeeting action (assuming it handles success/failure internally)
      const meetingData = await createMeeting({
        ...values,
        eventId,
        userId,
      });

      // Initialize the path variable to use it later in the finally block
      const path = `/book/${meetingData.userId}/${
        meetingData.eventId
      }/success?startTime=${meetingData.startTime.toISOString()}`;
      router.push(path);
    } catch (error: any) {
      // Handle any error that occurs during the meeting creation
      form.setError("root", {
        message: `There was an unknown error saving your event ${error.message}`,
      });
    }
  }

  if (form.formState.isSubmitting) return <Booking />;

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex gap-6 flex-col"
      >
        {/* Show root error message if form submission fails */}
        {form.formState.errors.root && (
          <div className="text-destructive text-sm">
            {form.formState.errors.root.message}
          </div>
        )}

        {/* Timezone selection field */}
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
                  {/* List all supported timezones with offset */}
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

        <div className="flex gap-4 flex-col md:flex-row">
          {/* Date picker field */}
          <FormField
            control={form.control}
            name="date"
            render={({ field }) => (
              <Popover>
                <FormItem className="flex-1">
                  <FormLabel>Date</FormLabel>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        className={cn(
                          "pl-3 text-left font-normal flex w-full",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? (
                          formatDate(field.value)
                        ) : (
                          <span>Pick a date</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      disabled={(date) =>
                        // Only allow selecting dates that have available time slots
                        !validTimesInTimezone.some((time) =>
                          isSameDay(date, time)
                        )
                      }
                      initialFocus
                    />
                  </PopoverContent>
                  <FormMessage />
                </FormItem>
              </Popover>
            )}
          />

          {/* Time selection field */}
          <FormField
            control={form.control}
            name="startTime"
            render={({ field }) => (
              <FormItem className="flex-1">
                <FormLabel>Time</FormLabel>
                <Select
                  disabled={date == null || timezone == null}
                  onValueChange={(value) =>
                    field.onChange(new Date(Date.parse(value)))
                  }
                  defaultValue={field.value?.toISOString()}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue
                        placeholder={
                          date == null || timezone == null
                            ? "Select a date/timezone first"
                            : "Select a meeting time"
                        }
                      />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {/* Show time options only for the selected day */}
                    {validTimesInTimezone
                      .filter((time) => isSameDay(time, date))
                      .map((time) => (
                        <SelectItem
                          key={time.toISOString()}
                          value={time.toISOString()}
                        >
                          {formatTimeString(time)}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex gap-4 flex-col md:flex-row">
          {/* Guest name input */}
          <FormField
            control={form.control}
            name="guestName"
            render={({ field }) => (
              <FormItem className="flex-1">
                <FormLabel>Your Name</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Guest email input */}
          <FormField
            control={form.control}
            name="guestEmail"
            render={({ field }) => (
              <FormItem className="flex-1">
                <FormLabel>Your Email</FormLabel>
                <FormControl>
                  <Input type="email" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Optional notes textarea */}
        <FormField
          control={form.control}
          name="guestNotes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes</FormLabel>
              <FormControl>
                <Textarea className="resize-none" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Cancel and Submit buttons */}
        <div className="flex gap-2 justify-end">
          <Button
            disabled={form.formState.isSubmitting}
            type="button"
            asChild
            variant="outline"
          >
            <Link href={`/book/${userId}`}>Cancel</Link>
          </Button>
          <Button
            className="cursor-pointer hover:scale-105 bg-blue-400 hover:bg-blue-600"
            disabled={form.formState.isSubmitting}
            type="submit"
          >
            Book Event
          </Button>
        </div>
      </form>
    </Form>
  );
}
