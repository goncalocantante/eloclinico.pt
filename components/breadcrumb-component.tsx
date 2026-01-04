"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

// Custom labels for route segments
const segmentLabels: Record<string, string> = {
  calendar: "Agenda",
  schedule: "Disponibilidade",
  patients: "Pacientes",
  events: "Eventos",
  availability: "Disponibilidade",
};

// Calendar view routes that should not show breadcrumbs
const calendarViewRoutes = [
  "week-view",
  "day-view",
  "month-view",
  "year-view",
  "agenda-view",
];

function formatSegment(segment: string): string {
  // Check if there's a custom label for this segment
  if (segmentLabels[segment]) {
    return segmentLabels[segment];
  }

  // Otherwise, format the segment name
  // Convert kebab-case or snake_case to Title Case
  return segment
    .split(/[-_]/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export function BreadcrumbComponent() {
  const pathname = usePathname();

  // Only show breadcrumbs for /dashboard routes with more than 2 segments
  if (!pathname.startsWith("/dashboard")) {
    return null;
  }

  // Split pathname into segments and filter out empty strings
  const segments = pathname.split("/").filter(Boolean);

  // Only show breadcrumbs if there are more than 2 segments (dashboard + 2+ more)
  // For example: /dashboard/agenda = 2 segments (don't show)
  //              /dashboard/agenda/disponibilidade = 3 segments (show)
  if (segments.length <= 2) {
    return null;
  }

  // Don't show breadcrumbs for calendar view routes
  // e.g., /dashboard/calendar/week-view should not show breadcrumbs
  const isCalendarView =
    segments.length >= 3 &&
    segments[1] === "calendar" &&
    calendarViewRoutes.includes(segments[2]);

  if (isCalendarView) {
    return null;
  }

  // Remove "dashboard" from segments for display
  const displaySegments = segments.slice(1);

  // Build breadcrumb items
  const breadcrumbItems = displaySegments.map(
    (segment: string, index: number) => {
      const isLast = index === displaySegments.length - 1;
      const href = "/" + segments.slice(0, index + 2).join("/");
      const label = formatSegment(segment);

      if (isLast) {
        return (
          <BreadcrumbItem key={href}>
            <BreadcrumbPage>{label}</BreadcrumbPage>
          </BreadcrumbItem>
        );
      }

      return (
        <BreadcrumbItem key={href}>
          <BreadcrumbLink asChild>
            <Link href={href}>{label}</Link>
          </BreadcrumbLink>
          <BreadcrumbSeparator />
        </BreadcrumbItem>
      );
    }
  );

  return (
    <Breadcrumb>
      <BreadcrumbList>{breadcrumbItems}</BreadcrumbList>
    </Breadcrumb>
  );
}
